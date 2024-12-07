import './gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DepartureBoard from './screens/DepartureBoard';
import SettingsStack from './screens/Settings';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import UnionDepartureBoard from './screens/UnionDepartureBoard';

export default function App() {
  const Tab = createBottomTabNavigator();

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
                } else {
                  iconName = "settings"
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