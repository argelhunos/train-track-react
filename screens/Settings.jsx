import {View, Text, StyleSheet, Image} from 'react-native';
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
                <LineName 
                    lineName="Settings"
                    lineColour="#CECECD"
                    icon={<MaterialIcons name="settings" size={50} color="black" />}
                />
                <Text style={styles.sectionTitle}>Default Trip</Text>
                <SettingsItem 
                    img={<MaterialIcons name="location-pin" size={40} color="#10385B" />}
                    bgimg="#7EB4E4"
                    text="Default Stop"
                    onPress={() => navigation.navigate("Default Stop")}
                />
                <SettingsItem 
                    img={<Image source={require('../assets/gotrainicon.png')}/>}
                    bgimg="#8EB888"
                    text="Default Line"
                />
                <Text style={styles.sectionTitle}>Notification Settings</Text>
                <SettingsItem 
                    img={<MaterialIcons name="notifications" size={40} color="#D78B07" />}
                    bgimg="#FED691"
                    text="Set Notifications"
                />

                {/* <SelectList 
                    setSelected={(val) => setSelectedLine(val)}
                    data={trainLineSelections}
                    save="value"
                    onSelect={onLineChange}
                    placeholder={selectedLine}
                    boxStyles={{
                        backgroundColor: '#EEEAE3',
                    }}
                />

                {selectedLine ? 
                    <SelectList 
                        setSelected={(val) => setSelectedStop(val)}
                        data={stops}
                        save='value'
                        onSelect={onStopChange}
                        boxStyles={{
                            backgroundColor: '#EEEAE3',
                        }}
                    /> :
                    <></>
                } */}
                {/* <Text style={styles.sectionTitle}>Notifications</Text>
                <Button title="Display Notification" onPress={() => onDisplayNotification()}/> */}
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
            <Stack.Screen name="SettingsStack" component={Settings}/>
            <Stack.Screen name="Default Stop" component={DefaultStop}/>
        </Stack.Navigator>
    )
}

export default SettingsStack;