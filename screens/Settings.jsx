import {View, Text, StyleSheet, Image, Pressable} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectList } from 'react-native-dropdown-select-list';
import { useEffect, useState } from 'react';
import { trainLineSelections, getStops } from '../data/dropdownOptions';
import { getItem, removeItem, setItem } from '../utils/AsyncStorage';
import { onDisplayNotification } from '../services/notificationsService';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar';
import LineName from '../components/LineName';
import SettingsItem from '../components/SettingsItem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import DefaultStop from './DefaultStop';
import DefaultStopModal from './DefaultStopModal';
import Notifications from './Notifications';
import NotificationsModal from './NotificationsModal';
import {PermissionsAndroid} from 'react-native';
PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

const Stack = createStackNavigator();

function Settings() {
    const insets = useSafeAreaInsets();
    const [stops, setStops] = useState([]);
    const navigation = useNavigation();

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#fff',
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
        }}>
            <FocusAwareStatusBar barStyle="light-content" /> 
            <View style={styles.container}>
                <Pressable onPress={() => { console.warn("hi")}}>
                    <View>
                        <LineName 
                            lineName="Settings"
                            lineColour="#CECECD"
                            icon={<MaterialIcons name="settings" size={50} color="black" />}
                        />
                    </View>
                </Pressable>
                <Text style={styles.sectionTitle}>Default Trip</Text>
                <SettingsItem 
                    img={<MaterialIcons name="location-pin" size={40} color="#10385B" />}
                    bgimg="#7EB4E4"
                    text="Default Stop"
                    onPress={() => navigation.navigate("Default Stop")}
                />
                <Text style={styles.sectionTitle}>Notification Settings</Text>
                <SettingsItem 
                    img={<MaterialIcons name="notifications" size={40} color="#D78B07" />}
                    bgimg="#FED691"
                    text="Set Notifications"
                    onPress={() => navigation.navigate("Notifications")}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      flex: 1,
      padding: '5%',
      gap: 15,
    },
    sectionTitle: {
        fontWeight: '500',
        fontSize: 20
    }
});

function SettingsStack() {
    return (
        <Stack.Navigator 
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Group>
                <Stack.Screen name="SettingsStack" component={Settings}/>
                <Stack.Screen name="Default Stop" component={DefaultStop}/>
                <Stack.Screen name="Notifications" component={Notifications}/>
            </Stack.Group>
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name="Default Stop Modal" component={DefaultStopModal}/>
            </Stack.Group>
            <Stack.Group screenOptions={{ presentation: 'transparentModal' }}>
                <Stack.Screen name="Notifications Modal" component={NotificationsModal}/>
            </Stack.Group>
        </Stack.Navigator>
    )
}

export default SettingsStack;