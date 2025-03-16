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
import { doc, getFirestore, addDoc, collection, deleteDoc, query, where, getDocs, updateDoc } from '@react-native-firebase/firestore'
import * as Application from 'expo-application';
import { convertStopToCode, stopToCodeMap } from '../data/dropdownOptions';

const Stack = createStackNavigator();
let dbInstance = null;

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

//#region TODO: move to new file YOU REALLY NEED TO MOVE EVERYTHING
const convertTimeToUTCMinutesSinceMidnight = (time) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.getUTCHours() * 60 + date.getUTCMinutes();
}

const initDB = async () => {
    try {
        const db = getDb();
        await db.execAsync(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, line TEXT, stop TEXT, time TEXT, isActive BOOLEAN);`);
        console.log("DB created");
    } catch (error) {
        console.log(error);
    }
}

const getDb = async () => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync("notifications");
    }
    return dbInstance;
}

const fetchNotifications = async () => {
    try {
        const db = await getDb();
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        console.log(allRows);
        return allRows;   
    } catch (error) {
        console.log(error);
    }
}

const dropTable = async () => {
    try {
        const db = await getDb();
        await db.execAsync(`DROP TABLE notifications`);
    } catch (error) {
        console.log(error);
    }
}

const addNotification = async (line, stop, time) => {
    try {
        const db = await getDb();
        const result = await db.runAsync('INSERT INTO notifications (line, stop, time, isActive) VALUES (?, ?, ?, ?)', line, stop, time, 1);
        console.log("added notification: ", result);
        return result;        
    } catch (error) {
        console.log(error);
    }
}

const deleteNotification = async (id) => {
    try {
        const db = await getDb();
        const notificationToDelete = await db.getFirstAsync('SELECT * FROM notifications WHERE id = ?', id);
        await db.runAsync('DELETE FROM notifications WHERE id = ?', id);
        await deleteNotificationInFirebase(notificationToDelete.line, notificationToDelete.stop, notificationToDelete.time);
    } catch (error) {
        console.log(error);
    }
}

const editNotification = async (id, newLine, newStop, newTime) => {
    try {
        const db = await getDb();
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

// note: time gets converted to minutes since midnight to store in the database for better querying in backend
// note 2: lastSent starts off as null to represent that it has not been sent ever
const storeNotificationInFirestore = async (line, stop, time) => {
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

const deleteNotificationInFirebase = async (line, stop, time) => {
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

const editNotificationInFirebase = async (oldData, newData) => {
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
                    <ScrollView
                        contentContainerStyle={{
                            display: 'flex',
                            rowGap: 15
                            }}
                    >
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
        backgroundColor: '#7cab84',
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