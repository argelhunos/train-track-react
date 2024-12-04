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

function Settings() {
    const insets = useSafeAreaInsets();
    const [selectedLine, setSelectedLine] = useState("");
    const [selectedStop, setSelectedStop] = useState("");
    const [stops, setStops] = useState([]);

    useEffect(() => {
        getItem('line')
            .then(data => {
                setSelectedLine(data);
                getStops()
                    .then(data => setStops(data));
            })
            .catch(error => console.log(error));
        
        getItem('stop')
            .then(data => {
                setSelectedStop(data);
            })
            .catch(error => console.log(error));

        console.log("done!");
    }, [])

    const onLineChange = () => {
        // if line selected was the same as previous, exit early.
        try {
            let oldLine = getItem('line');
            if (oldLine === selectedLine) {
                return
            }
        } catch (error) {
            console.error(error);
        }

        // select list already handles state change, just need to save it to async storage
        setItem('line', selectedLine)
            .then(() => {
                // update stops each time the line changes.
                getStops()
                    .then(data => setStops(data))
            })
        // erase selected stop with line change, 
        setSelectedStop("");
        removeItem('stop');
    }

    const onStopChange = () => {
        setItem('stop', selectedStop)
    }

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

export default Settings;