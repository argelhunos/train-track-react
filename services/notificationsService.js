import { getDB } from "./database";
import { convertStopToCode, stopToCodeMap } from '../data/dropdownOptions';
import { doc, getFirestore, addDoc, collection, deleteDoc, query, where, getDocs, updateDoc, firebase } from '@react-native-firebase/firestore'
import * as Application from 'expo-application';
import { ToastAndroid } from "react-native";
import Constants from 'expo-constants';

const SCHEDULE_NOTIFICATION = "https://us-central1-train-track-d2ca0.cloudfunctions.net/scheduleNotification";
const EDIT_NOTIFICATION = "https://us-central1-train-track-d2ca0.cloudfunctions.net/editNotification";
const TOGGLE_NOTIFICATION = "https://us-central1-train-track-d2ca0.cloudfunctions.net/toggleNotification";
const DELETE_NOTIFICATION = "https://us-central1-train-track-d2ca0.cloudfunctions.net/deleteNotification";
const FUNCTION_KEY = Constants.expoConfig.extra.functionKey;

//#region 
// -------- toggle notifications in Firebase and local SQLite database --------
const toggleNotificationInCloud = async (cloudJobPath, firebaseDocumentId) => {
    try {
        console.log("toggling notification in cloud");
        
        const response = await fetch(TOGGLE_NOTIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': FUNCTION_KEY
            },
            body: JSON.stringify({cloudJobPath, firebaseDocumentId})
        });

        if (response.ok) {
            const result = await response.json();
            return result.currentStatus;
        } else {
            const errMsg = await response.text();
            throw new Error(errMsg);
        }
    } catch (error) {
        console.log("error occurred toggling notification", error);
    }
}

const toggleNotificationActiveLocal = async (id, enabledStatus) => {
    try {
        const db = await getDB();
        await db.runAsync(`UPDATE notifications SET isActive = ? WHERE id = ?`, [enabledStatus, id]);
        console.log("Notification toggled");
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        console.log(allRows);
    } catch (error) {
        console.log(error);
    }
}

export const toggleNotification = async (id, setNotificationActive) => {
    try {
        const db = await getDB();
        const notificationToToggle = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);

        const enabledStatus = await toggleNotificationInCloud(
            notificationToToggle.cloudSchedulerName,
            notificationToToggle.firebaseId 
        );
        
        await toggleNotificationActiveLocal(id, enabledStatus);
        setNotificationActive(enabledStatus);
    } catch (error) {
        console.log(error);
    }
}
//#endregion

//#region
// ------------- CRUD operations for notifications screen -------

export const addNotification = async (line, stop, time, towardsUnion) => {
    try {
        const db = await getDB();

        // store notification in firebase first to get corresponding firebaseId and cloudSchedulerName
        const {createdJob, notificationId} = await storeNotificationInCloud(line, stop, time, towardsUnion);

        // store notification locally
        const result = await db.runAsync('INSERT INTO notifications (line, stop, time, isActive, firebaseId, cloudSchedulerName, towardsUnion) VALUES (?, ?, ?, ?, ?, ?, ?)', line, stop, time, 1, notificationId, createdJob, towardsUnion);
        console.log("added notification: ", result);
        return result;        
    } catch (error) {
        console.log(error);
    }
}

export const storeNotificationInCloud = async (line, stop, time, towardsUnion) => {
    try {
        const userDoc = `users/${Application.getAndroidId()}`;
        const schedule = convertTimeToCronSchedule(time);
        const stopCode = stopToCodeMap.get(stop);

        const notificationBody = {
            givenUserDoc: userDoc,
            stopCode: stopCode,
            schedule: schedule,
            line: line,
            towardsUnion: towardsUnion
        };
        
        const response = await fetch(SCHEDULE_NOTIFICATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': FUNCTION_KEY
            },
            body: JSON.stringify(notificationBody)
        });

        const apiResponse = await response.json();
        console.log("notification stored in firebase successfully");

        const createdJob = apiResponse.createdJob;
        const notificationId = apiResponse.notificationId;

        return { createdJob, notificationId };
    } catch (error) {
        console.log("error storing notification in firebase", error)
    }
}

//TODO: move this to utils
export const convertTimeToCronSchedule = (time) => {
    const [hour, minute] = time.split(":");
    const cronString = `${minute} ${hour} * * *`;
    
    return cronString;
}

export const fetchNotifications = async () => {
    try {
        const db = await getDB();
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        console.log(allRows);

        // switch from database's 1 and 0 to true and false for easier parsing in components
        return allRows.map(notification => ({
            ...notification,
            isActive: notification.isActive == 1 ? true : false
        }));   
    } catch (error) {
        console.log(error);
    }
}

export const editNotification = async (id, newLine, newStop, newTime, towardUnion) => {
    try {
        console.log("editing notification");
        const db = await getDB();

        const stopCode = stopToCodeMap.get(newStop);
        const schedule = convertTimeToCronSchedule(newTime);
        const notificationToEdit = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);
        const cloudJobPath = notificationToEdit.cloudSchedulerName;
        const firebaseDocumentId = notificationToEdit.firebaseId;
        const givenUserDoc = `users/${Application.getAndroidId()}`;
        const enabled = notificationToEdit.isActive == 1;

        const notification = {
            stopCode,
            schedule,
            line: newLine,
            towardsUnion: towardUnion,
            enabled
        }
        
        await editNotificationInCloud(cloudJobPath, firebaseDocumentId, givenUserDoc, notification);
        await db.runAsync('UPDATE notifications SET line = ?, stop = ?, time = ?, towardsUnion = ? WHERE id = ?', newLine, newStop, newTime, towardUnion == 1 ? true : false, id);

    } catch (error) {
        console.log("there was an error editing the notification: ", error);
    }
}

// TODO: again, delete when completely removed
export const editNotificationInCloud = async (cloudJobPath, firebaseDocumentId, givenUserDoc, notification) => {
    console.log("editing notification in cloud");

    const body = {
        cloudJobPath,
        firebaseDocumentId,
        givenUserDoc,
        notification
    };

    console.log(body);
    console.log(notification);

    const response = await fetch(EDIT_NOTIFICATION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': FUNCTION_KEY
        },
        body: JSON.stringify(body)
    });

    if (response.ok) {
        console.log("successfully edited notification in cloud.");
    } else {
        const errMsg = await response.text();
        throw new Error(errMsg);
    }
    
}

export const deleteNotification = async (id) => {
    try {
        const db = await getDB();
        const notificationToDelete = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);
        await db.runAsync('DELETE FROM notifications WHERE id = ?', id);
        console.log(notificationToDelete.cloudSchedulerName, notificationToDelete.firebaseId);
        await deleteNotificationInCloud(notificationToDelete.cloudSchedulerName, notificationToDelete.firebaseId);
    } catch (error) {
        console.log(error);
    }
}

// again not needed
export const deleteNotificationInCloud = async (cloudSchedulerName, firebaseId) => {
    const response = await fetch(DELETE_NOTIFICATION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': FUNCTION_KEY
        },
        body: JSON.stringify({ cloudJobPath: cloudSchedulerName, firebaseDocumentId: firebaseId })
    });

    if (response.ok) {
        console.log("successfully deleted notification in cloud.");
    } else {
        throw new Error(response.status);
    }
}

const dropTable = async () => {
    try {
        const db = await getDB();
        await db.execAsync(`DROP TABLE notifications`);
    } catch (error) {
        console.log(error);
    }
}

//#endregion

//#region
// TODO: MOVE THIS TO UTILS
// TODO: this actually isn't needed anymore bc better backend design coming
const convertTimeToUTCMinutesSinceMidnight = (time) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.getUTCHours() * 60 + date.getUTCMinutes();
}

//#endregion