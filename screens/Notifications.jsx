import {View, Text, StyleSheet, Pressable, ScrollView, LayoutAnimation, Platform, UIManager, Button } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar';
import LineName from '../components/LineName';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';
import { useState, useEffect } from 'react';
import SavedNotification from '../components/SavedNotification';
import notifee, { RepeatFrequency, TriggerType } from '@notifee/react-native';
import { doc, getFirestore, addDoc, collection, deleteDoc, query, where, getDocs, updateDoc } from '@react-native-firebase/firestore'
import * as Application from 'expo-application';
import messaging from '@react-native-firebase/messaging';
import { convertStopToCode, stopToCodeMap } from '../data/dropdownOptions';

const Stack = createStackNavigator();

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

//#region TODO: move to new file

const initDB = async () => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        await db.execAsync(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, line TEXT, stop TEXT, time TEXT, isActive BOOLEAN);`);
        console.log("DB created");
    } catch (error) {
        console.log(error);
    }
}

const fetchNotifications = async () => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        console.log(allRows);
        return allRows;   
    } catch (error) {
        console.log(error);
    }
}

const saveNotificationToTrigger = async (time, id) => {
    // convert time given to time obj
    const timeObj = new Date(Date.now());
    timeObj.setHours(time.split(":")[0]);
    timeObj.setMinutes(time.split(":")[1]);


    // create a channel for Android
    const channelId = await notifee.createChannel({
        id: `${id}`,
        name: 'Default Channel',
    });

    // create time based trigger
    const trigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: timeObj.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
    };

    console.log("saving notification to trigger");
    // create notification with trigger!
    await notifee.createTriggerNotification(
        {
          title: 'Meeting with Jane',
          body: 'Today at 11:20am',
          android: {
            channelId: channelId,
          },
        },
        trigger,
    );
}

const dropTable = async () => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        await db.execAsync(`DROP TABLE notifications`);
    } catch (error) {
        console.log(error);
    }
}

const addNotification = async (line, stop, time) => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        const result = await db.runAsync('INSERT INTO notifications (line, stop, time, isActive) VALUES (?, ?, ?, ?)', line, stop, time, 1);
        console.log("added notification: ", result);
        return result;        
    } catch (error) {
        console.log(error);
    }
}

const deleteNotification = async (id) => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        const notificationToDelete = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);
        await db.runAsync('DELETE FROM notifications WHERE id = ?', id);
        await deleteNotificationInFirebase(notificationToDelete.line, notificationToDelete.stop, notificationToDelete.time);
    } catch (error) {
        console.log(error);
    }
}

const editNotification = async (id, newLine, newStop, newTime) => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
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

const storeNotificationInFirestore = async (line, stop, time) => {
    try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", Application.getAndroidId());
        const stopCode = stopToCodeMap.get(stop);
        await addDoc(collection(db, "notifications"), {
            docRef: userDocRef,
            isActive: true,
            station: stopCode,
            line: line,
            time: time
        });
        console.log("notification stored in firebase successfully");
    } catch (error) {
        console.log("error storing notification in firebase", error)
    }
}

const deleteNotificationInFirebase = async (line, stop, time) => {
    try {
        const db = getFirestore();
        const userDocRef = doc(db, "users", Application.getAndroidId());
        const q = query(
            collection(db, "notifications"),
            where('docRef', '==', userDocRef),
            where('station', '==', stop),
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

const editNotificationInFirebase = async (oldData, newData) => {
    try {
        console.log("editing notification in firebase");
        const db = getFirestore();
        const userDocRef = doc(db, "users", Application.getAndroidId());

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
                time: newData.time
            })
        });

        if (querySnapshot.empty) {
            console.log("no notifications found to edit");
        }
    } catch (error) {
        console.log("error editing notification in firebase", error);
    }
}

//#endregion

function Notifications({ route }) {
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // defined inside since has to update state of notifications
    const onDeletePress = async (id) => {
        deleteNotification(id)
            .then(data => { return fetchNotifications() })
            .then((data) => {
                setNotifications(data);
                console.log(data);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            });
    }

    useEffect(() => {
        initDB()
            .then(data => {
                return fetchNotifications();
            })
            .then((data) => {
                setNotifications(data);
            })
            .finally(setIsLoading(false))
    }, []);

    useEffect(() => {
        console.log(route.params);
        if (route.params?.line && route.params?.stop && route.params?.time && route.params?.isEditMode != true) {
            storeNotificationInFirestore(route.params.line, route.params.stop, route.params.time)
                .catch((error) => console.log("an error occured when storing in firebase."));
            addNotification(route.params.line, route.params.stop, route.params.time)
                .then(data => {
                    saveNotificationToTrigger(route.params.time, data.lastInsertRowId);
                    return fetchNotifications()
                })
                .then(data => setNotifications(data))
                .catch(error => console.log("something went wrong: ", error));
        } else if (route.params?.isEditMode) {
            editNotification(route.params.id, route.params.line, route.params.stop, route.params.time)
                .then(data => fetchNotifications())
                .then(data => setNotifications(data))
                .catch(error => console.log("error editing notification: ", error));
        }
    }, [route.params?.line, route.params?.stop, route.params?.time]);

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#fff',
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
        }}>
            <View style={styles.container}>
                <FocusAwareStatusBar barStyle="light-content" />
                <Pressable
                    onPress={() => navigation.goBack()}
                >
                    <LineName 
                        lineName="Notifications"
                        lineColour="#CECECD"
                        icon={<MaterialIcons name="arrow-back" size={50} color="black" />}
                    />
                </Pressable> 
                <View style={styles.noNotifsMsg}>
                    <ScrollView>
                        {isLoading ? <Text>No notifications.</Text> : notifications.map((notification) => {
                            return (
                                <SavedNotification 
                                    time={notification.time} 
                                    station={notification.stop} 
                                    line={notification.line} 
                                    id={notification.id}
                                    key={notification.id} 
                                    deleteMethod={onDeletePress}
                                    isActive={notification.isActive === 1 ? true : false}
                                />
                            )
                        })}
                    </ScrollView>
                </View>
                <Pressable
                    style={styles.addNotifButton}
                    onPress={() => navigation.navigate("Notifications Modal")}
                >
                    <MaterialIcons name="add" size={50} color="black" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
        padding: '5%',
        gap: 15,
    },
    addNotifButton: {
        backgroundColor: '#7EB4E4',
        padding: 10,
        alignItems: 'center',
        width: 75,
        borderRadius: 50,
        alignSelf: 'center',
        bottom: 15,
        position: 'absolute',
    }
})

export default Notifications;