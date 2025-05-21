import {View, ActivityIndicator, StyleSheet, Pressable, ScrollView, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar';
import LineName from '../components/LineName';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import SavedNotification from '../components/SavedNotification';
import { initDB } from '../services/database';
import { fetchNotifications, addNotification, editNotification, deleteNotification, storeNotificationInCloud } from '../services/notificationsService';

const Stack = createStackNavigator();

function Notifications({ route }) {
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    // defined inside since has to update state of notifications
    const onDeletePress = async (id) => {
        try {
            await deleteNotification(id);
            const data = await fetchNotifications();
            setNotifications(data);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        } catch (error) {
            console.log("An error occured deleting notification: ", error);
        }
    }

    const handleAddNotification = async () => {
        try {
            // await storeNotificationInFirestore(route.params.line, route.params.stop, route.params.time);
            await addNotification(route.params.line, route.params.stop, route.params.time, "test", "test", route.params.towardsUnion);
            const data = await fetchNotifications();
            setNotifications(data);
        } catch (error) {
            console.log("Error adding notification: ", error);
        }
    }

    const handleEditNotification = async () => {
        try {
            console.log("editing notification");
            await editNotification(route.params.id, route.params.line, route.params.stop, route.params.time, route.params.towardsUnion);
            const data = await fetchNotifications();
            setNotifications(data);
        } catch (error) {
            console.log("error adding notification: ", error);
        }
    }

    const onAddNotificationModalReturn = () => {
        const params = route.params;

        if (!params) {
            return; // guard if this ends up being null
        }

        if (params.isEditMode) {
            handleEditNotification();
        }

        if (!params.isEditMode && params.line && params.stop && params.time) {
            handleAddNotification();
        }
    }

    useEffect(() => {
        const init = async () => {
            try {
                await initDB();
                const data = await fetchNotifications();
                setNotifications(data);
            } catch (error) {
                console.log("Error initializing Notifications screen:", error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        onAddNotificationModalReturn();
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
                        {isLoading && notifications.length != 0? <ActivityIndicator size="large" /> : notifications.map((notification) => {
                            return (
                                <SavedNotification 
                                    notification={notification}
                                    key={notification.id} 
                                    deleteMethod={onDeletePress}
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