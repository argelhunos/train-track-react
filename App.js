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
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useEffect } from 'react';
import * as Application from 'expo-application';

// import firestore from '@react-native-firebase/firestore';
import { doc, setDoc, getFirestore } from '@react-native-firebase/firestore'

const storeFCMToken = async (token) => {
  try {
    const db = getFirestore();
    const docRef = doc(db, 'users', Application.getAndroidId());
    await setDoc(docRef, {
      fcmToken: token
    });
    console.log("stored token successfully.")
  } catch (error) {
    console.log("error when storing token: ", error)
  }
}

async function onMessageReceived(message) {
  const data = message.data;

  const channelId = await notifee.createChannel({
    id: 'train-notifications-1',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH
  });

  notifee.displayNotification({
    title: data.title,
    body: data.body,
    android: {
      channelId: channelId
    }
  })
}

messaging().onMessage(onMessageReceived);
messaging().setBackgroundMessageHandler(onMessageReceived);

export default function App() {
  const Tab = createBottomTabNavigator();

  useEffect(() => {  
    messaging().getToken().then(token => {
      storeFCMToken(token);
    });

    const userId = Application.getAndroidId();
    console.log("Unique device ID: " + userId);
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