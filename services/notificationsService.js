import { getDB } from "./database";
import { convertStopToCode, stopToCodeMap } from '../data/dropdownOptions';
import { doc, getFirestore, addDoc, collection, deleteDoc, query, where, getDocs, updateDoc } from '@react-native-firebase/firestore'
import * as Application from 'expo-application';
import { ToastAndroid } from "react-native";

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

const toggleNotificationActiveLocal = async (line, stop, time) => {
    try {
        const db = await getDB();
        const result = await db.runAsync(`UPDATE notifications SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE line = ? AND stop = ? AND time = ?`, [line, stop, time]);
        console.log("Notification toggled");
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        console.log(allRows);
    } catch (error) {
        console.log(error);
    }
}

export const toggleNotification = async (line, stop, time, setNotificationActive) => {
    try {
        await toggleNotificationInFirebase(line, stop, time);
        await toggleNotificationActiveLocal(line, stop, time);
        setNotificationActive(prev => !prev);
    } catch (error) {
        console.log(error);
    }
}
//#endregion

//#region
// ------------- CRUD operations for notifications screen -------

export const addNotification = async (line, stop, time) => {
    try {
        const db = await getDB();
        const result = await db.runAsync('INSERT INTO notifications (line, stop, time, isActive) VALUES (?, ?, ?, ?)', line, stop, time, 1);
        console.log("added notification: ", result);
        return result;        
    } catch (error) {
        console.log(error);
    }
}

// note: time gets converted to minutes since midnight to store in the database for better querying in backend
// note 2: lastSent starts off as null to represent that it has not been sent ever
export const storeNotificationInFirestore = async (line, stop, time) => {
    try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", Application.getAndroidId());
        const stopCode = stopToCodeMap.get(stop);
        const minutesSinceMidnight = convertTimeToUTCMinutesSinceMidnight(time);


        // old date to represent that it has not been sent yet
        const defaultDate = new Date();
        defaultDate.setUTCHours(0, 0, 0, 0);
        defaultDate.setUTCFullYear(1970, 0, 1);

        await addDoc(collection(db, "notifications"), {
            docRef: userDocRef,
            isActive: true,
            station: stopCode,
            line: line,
            time: time,
            minutesSinceMidnight: minutesSinceMidnight,
            lastSent: defaultDate,
        });
        console.log("notification stored in firebase successfully");
    } catch (error) {
        console.log("error storing notification in firebase", error)
    }
}

export const testDate = (time) => {
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

export const editNotification = async (id, newLine, newStop, newTime) => {
    try {
        const db = await getDB();
        const notificationToEdit = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);
        await db.runAsync('UPDATE notifications SET line = ?, stop = ?, time = ? WHERE id = ?', newLine, newStop, newTime, id);
        await editNotificationInFirebase(
            { line: notificationToEdit.line, stop: notificationToEdit.stop, time: notificationToEdit.time }, // old data
            { line: newLine, stop: newStop, time: newTime } // new data
        )
    } catch (error) {
        console.log("there was an error editing the notification: ", error);
    }
}

export const editNotificationInFirebase = async (oldData, newData) => {
    try {
        console.log("editing notification in firebase");
        const db = getFirestore();
        const userDocRef = doc(db, "users", Application.getAndroidId());
        const minutesSinceMidnight = convertTimeToUTCMinutesSinceMidnight(newData.time);

        // oops my bad. query stores the stop using the code, make sure to convert name to code
        const oldStopCode = convertStopToCode(oldData.stop);
        const newStopCode = convertStopToCode(newData.stop);

        const q = query(
            collection(db, "notifications"),
            where('docRef', '==', userDocRef),
            where('station', '==', oldStopCode),
            where('line', '==', oldData.line),
            where('time', '==', oldData.time)
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(notification => {
            updateDoc(notification.ref, {
                line: newData.line,
                station: newStopCode,
                time: newData.time,
                minutesSinceMidnight: minutesSinceMidnight
            })
        });

        if (querySnapshot.empty) {
            console.log("no notifications found to edit");
        }
    } catch (error) {
        console.log("error editing notification in firebase", error);
    }
}

export const deleteNotification = async (id) => {
    try {
        const db = await getDB();
        const notificationToDelete = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);
        await db.runAsync('DELETE FROM notifications WHERE id = ?', id);
        await deleteNotificationInFirebase(notificationToDelete.line, notificationToDelete.stop, notificationToDelete.time);
    } catch (error) {
        console.log(error);
    }
}

export const deleteNotificationInFirebase = async (line, stop, time) => {
    try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", Application.getAndroidId());
        const stopCode = stopToCodeMap.get(stop);
        const q = query(
            collection(db, "notifications"),
            where('docRef', '==', userDocRef),
            where('station', '==', stopCode),
            where('line', '==', line),
            where('time', '==', time)
        );

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(notification => {
            // old namespace approach (doing the doc function is redundant)
            // deleteDoc(doc(db, "notifications", notification.id));
            deleteDoc(notification.ref);
            console.log("successfully deleted notif", notification.id);
        });

        if (querySnapshot.empty) {
            console.log("no notifications found to delete");
        }
    } catch (error) {
        console.log("error deleting notification in firebase", error);
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
const convertTimeToUTCMinutesSinceMidnight = (time) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.getUTCHours() * 60 + date.getUTCMinutes();
}

//#endregion