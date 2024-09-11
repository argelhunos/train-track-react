import registerRootComponent from 'expo/build/launch/registerRootComponent';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import App from './App.js';
import { widgetTaskHandler } from './widget/widget-task-handler';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// register handler that will ahndle adding it to the home screen
registerWidgetTaskHandler(widgetTaskHandler);