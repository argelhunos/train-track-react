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
import messaging from '@react-native-firebase/messaging';

const Stack = createStackNavigator();

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
        await db.runAsync('DELETE FROM notifications WHERE id = ?', id);
    } catch (error) {
        console.log(error);
    }
}

async function onAppBootstrap() {
    // Register the device with FCM
    await messaging().registerDeviceForRemoteMessages();
  
    // Get the token
    const token = await messaging().getToken();
  
    console.log('FCM Token:', token);
}

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
        onAppBootstrap();
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
        if (route.params?.line && route.params?.stop && route.params?.time) {
            addNotification(route.params.line, route.params.stop, route.params.time)
                .then(data => {
                    saveNotificationToTrigger(route.params.time, data.lastInsertRowId);
                    return fetchNotifications()
                })
                .then(data => setNotifications(data))
                .catch(error => console.log("something went wrong: ", error));
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