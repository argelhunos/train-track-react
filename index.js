import registerRootComponent from 'expo/build/launch/registerRootComponent';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import App from './App.js';
import { widgetTaskHandler } from './widget/widget-task-handler';
// import notifee, { EventType } from '@notifee/react-native';

// // register handler that will handle notification events
// notifee.onBackgroundEvent(async ({ type, detail }) => {
//     // check if user saved notification is delivered
//     if (type === EventType.DELIVERED) {
        
//     }
// });

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// register handler that will ahndle adding it to the home screen
registerWidgetTaskHandler(widgetTaskHandler);