import {View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar';
import LineName from '../components/LineName';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import * as SQLite from 'expo-sqlite';
import { useState, useEffect } from 'react';
import SavedNotification from '../components/SavedNotification';

const Stack = createStackNavigator();

const initDB = async () => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        await db.execAsync(`CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, line TEXT, stop TEXT, time TEXT);`);
    } catch (error) {
        console.log(error);
    }
}

const fetchNotifications = async () => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        return allRows;   
    } catch (error) {
        console.log(error);
    }
}

const addNotification = async (line, stop, time) => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        const result = await db.runAsync('INSERT INTO notifications (line, stop, time) VALUES (?, ?, ?)', line, stop, time);
        return result;        
    } catch (error) {
        console.log(error);
    }
}

function Notifications({ route }) {
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

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
        if (route.params?.line && route.params?.stop && route.params?.time) {
            addNotification(route.params.line, route.params.stop, route.params.time)
                .then(() => {return fetchNotifications()})
                .then((data) => setNotifications(data));
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
                <LineName 
                    lineName="Notifications"
                    lineColour="#CECECD"
                    icon={<MaterialIcons name="arrow-back" size={50} color="black" />}
                />
                <View style={styles.noNotifsMsg}>
                    <ScrollView>
                        {isLoading ? <Text>No notifications.</Text> : notifications.map((notification) => {
                            return (
                                <SavedNotification time={notification.time} station={notification.stop} line={notification.line}/>
                                // <View key={notification.id}>
                                //     <Text>{notification.line} - {notification.stop} - {notification.time}</Text>
                                // </View>
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
        alignSelf: 'flex-end',
        bottom: 15,
        right: 15,
        position: 'absolute',
    }
})

export default Notifications;