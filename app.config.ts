import type { ConfigContext, ExpoConfig } from 'expo/config';
import type { WithAndroidWidgetsParams } from 'react-native-android-widget';
import 'dotenv/config';

const widgetConfig: WithAndroidWidgetsParams = {
  // Paths to all custom fonts used in all widgets (unused atm)
  fonts: ['./assets/fonts/Manrope-VariableFont_wght.ttf'],
  widgets: [
    {
      name: 'Departure', // This name will be the **name** with which we will reference our widget.
      label: 'Station Departure Board', // Label shown in the widget picker
      minWidth: '320dp',
      minHeight: '120dp',
      // This means the widget's default size is 5x2 cells, as specified by the targetCellWidth and targetCellHeight attributes.
      // Or 320×120dp, as specified by minWidth and minHeight for devices running Android 11 or lower.
      // If defined, targetCellWidth,targetCellHeight attributes are used instead of minWidth or minHeight.
      targetCellWidth: 5,
      targetCellHeight: 2,
      description: 'The TrainTrack widget instantly displays upcoming train departures, letting users stay updated without opening the app.', // Description shown in the widget picker
      previewImage: './assets/widget-preview/hello.png', // Path to widget preview image

      // How often, in milliseconds, that this AppWidget wants to be updated.
      // The task handler will be called with widgetAction = 'UPDATE_WIDGET'.
      // Default is 0 (no automatic updates)
      // Minimum is 1800000 (30 minutes == 30 * 60 * 1000).
      updatePeriodMillis: 1800000,
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TrainTrack',
  slug: 'TrainTrack',
  plugins: [['react-native-android-widget', widgetConfig]],
  extra: {
    apiKey: process.env.EXPO_PUBLIC_API_KEY,
    eas: {
      projectId: "badb8d77-7acc-4ef2-9a9f-8fa291453b29"
    }
  }
});