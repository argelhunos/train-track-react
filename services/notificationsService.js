import { getDB } from "./database";
import { convertStopToCode, stopToCodeMap } from '../data/dropdownOptions';
import { doc, getFirestore, addDoc, collection, deleteDoc, query, where, getDocs, updateDoc } from '@react-native-firebase/firestore'
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
const toggleNotificationInFirebase = async (line, stop, time) => {
    try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", Application.getAndroidId());
        const stopCode = convertStopToCode(stop);
        const q = query(
            collection(db, "notifications"),
            where('docRef', '==', userDocRef),
            where('station', '==', stopCode),
            where('line', '==', line),
            where('time', '==', time)
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(notification => {
            const notificationData = notification.data();
            updateDoc(doc(db, 'notifications', notification.id), {
                isActive: !notificationData.isActive
            });
            console.log("successfully toggled notification to ", !notificationData.isActive);
        })

        if (querySnapshot.empty) {
            console.log("No notifications found to toggle");
        }
    } catch (error) {
        console.log("error occurred saving notification", error);
    }
}

const toggleNotificationActiveLocal = async (id) => {
    try {
        const db = await getDB();
        const result = await db.runAsync(`UPDATE notifications SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE id = ?`, [id]);
        console.log("Notification toggled");
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        console.log(allRows);
    } catch (error) {
        console.log(error);
    }
}

export const toggleNotification = async (id, setNotificationActive) => {
    try {
        // await toggleNotificationInFirebase(line, stop, time);
        await toggleNotificationActiveLocal(id);
        setNotificationActive(prev => !prev);
    } catch (error) {
        console.log(error);
    }
}
//#endregion

//#region
// ------------- CRUD operations for notifications screen -------

export const addNotification = async (line, stop, time, firebaseId, cloudSchedulerName, towardsUnion) => {
    try {
        const db = await getDB();
        const result = await db.runAsync('INSERT INTO notifications (line, stop, time, isActive, firebaseId, cloudSchedulerName, towardsUnion) VALUES (?, ?, ?, ?, ?, ?, ?)', line, stop, time, 1, firebaseId, cloudSchedulerName, towardsUnion);
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
        const stopCode = stopToCodeMap(stop);

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

        const { createdJob, notificationId } = await response.json();
        console.log("notification stored in firebase successfully");

        return { createdJob, notificationId };
    } catch (error) {
        console.log("error storing notification in firebase", error)
    }
}

//TODO: move this to utils
export const convertTimeToCronSchedule = (time) => {
    const [hour, minute] = time.split(":");
    const cronString = `${minute} ${hour} * * *`;
    ToastAndroid.show(cronString, ToastAndroid.SHORT);
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
        console.log("hi");
        const db = await getDB();
        await db.runAsync('UPDATE notifications SET line = ?, stop = ?, time = ?, towardsUnion = ? WHERE id = ?', newLine, newStop, newTime, towardUnion == 1 ? true : false, id);
        // await editNotificationInFirebase(
        //     { line: notificationToEdit.line, stop: notificationToEdit.stop, time: notificationToEdit.time }, // old data
        //     { line: newLine, stop: newStop, time: newTime } // new data
        // )
    } catch (error) {
        console.log("there was an error editing the notification: ", error);
    }
}

// TODO: again, delete when completely removed
export const editNotificationInCloud = async () => {
    try {
        console.log("editing notification in firebase");

        
    } catch (error) {
        console.log("error editing notification in firebase", error);
    }
}

export const deleteNotification = async (id) => {
    try {
        const db = await getDB();
        const notificationToDelete = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);
        await db.runAsync('DELETE FROM notifications WHERE id = ?', id);
        // await deleteNotificationInFirebase(notificationToDelete.line, notificationToDelete.stop, notificationToDelete.time);
    } catch (error) {
        console.log(error);
    }
}

// again not needed
// export const deleteNotificationInFirebase = async (line, stop, time) => {
//     try {
//         const db = getFirestore();
//         const userDocRef = doc(db, "users", Application.getAndroidId());
//         const stopCode = stopToCodeMap.get(stop);
//         const q = query(
//             collection(db, "notifications"),
//             where('docRef', '==', userDocRef),
//             where('station', '==', stopCode),
//             where('line', '==', line),
//             where('time', '==', time)
//         );

//         const querySnapshot = await getDocs(q);

//         querySnapshot.forEach(notification => {
//             // old namespace approach (doing the doc function is redundant)
//             // deleteDoc(doc(db, "notifications", notification.id));
//             deleteDoc(notification.ref);
//             console.log("successfully deleted notif", notification.id);
//         });

//         if (querySnapshot.empty) {
//             console.log("no notifications found to delete");
//         }
//     } catch (error) {
//         console.log("error deleting notification in firebase", error);
//     }
// }

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