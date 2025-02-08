import './gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DepartureBoard from './screens/DepartureBoard';
import SettingsStack from './screens/Settings';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import UnionDepartureBoard from './screens/UnionDepartureBoard';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useEffect } from 'react';
import * as Application from 'expo-application';
import firestore from '@react-native-firebase/firestore';

export default function App() {
  const Tab = createBottomTabNavigator();

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    messaging().getToken().then(token => {
      console.log(token);
      firestore()
        .collection('users')
        .doc(Application.getAndroidId())
        .set({
          fcmToken: token,
        })
        .then(() => {
          console.log("FCM token saved to Firestore");
        });
    });

    const userId = Application.getAndroidId();
    console.log("Unique device ID: " + userId);

    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false, 
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === "Departure Board") {
                  iconName = "departure-board";
                } else if (route.name === "Settings") {
                  iconName = "settings"
                } else if (route.name === "Union Departures") {
                  iconName = "commit"
                }

                // return icon woo
                return <MaterialIcons name={iconName} size={size} color={color}/>
              },
              tabBarActiveTintColor: '#3A8446',
              tabBarInactiveTintColor: 'gray',
            })}
          >
            <Tab.Screen name="Departure Board" component={DepartureBoard} />
            <Tab.Screen name="Union Departures" component={UnionDepartureBoard} />
            <Tab.Screen name="Settings" component={SettingsStack} />
          </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}