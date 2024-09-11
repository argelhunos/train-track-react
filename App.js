import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DepartureBoard from './screens/DepartureBoard';
import Settings from './screens/Settings';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HelloWidgetPreviewScreen } from './screens/HelloWidgetPreviewScreen';

export default function App() {
  const Tab = createBottomTabNavigator();

  return (
    <SafeAreaProvider>
      <NavigationContainer>
          <Tab.Navigator
            screenOptions={{ headerShown: false}}
          >
            <Tab.Screen name="Departure Board" component={DepartureBoard} />
            <Tab.Screen name="Settings" component={Settings} />
            <Tab.Screen name="Widget Preview" component={HelloWidgetPreviewScreen}/>
          </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}