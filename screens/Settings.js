import {View, Text, StyleSheet} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SelectList } from 'react-native-dropdown-select-list';
import { useEffect, useState } from 'react';
import { trainLineSelections, getStops } from '../data/dropdownOptions';
import { getItem, removeItem, setItem } from '../utils/AsyncStorage';

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
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
        }}>
            <View style={styles.container}>
                <Text style={styles.header}>Settings</Text>
                <Text>Default Line</Text>
                <SelectList 
                    setSelected={(val) => setSelectedLine(val)}
                    data={trainLineSelections}
                    save="value"
                    onSelect={onLineChange}
                    placeholder={selectedLine}
                />
                <Text>Default Stop</Text>
                {selectedLine ? 
                    <SelectList 
                        setSelected={(val) => setSelectedStop(val)}
                        data={stops}
                        save='value'
                        onSelect={onStopChange}
                    /> :
                    <></>
                }
                
            </View>
            <StatusBar style='auto'/>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      flex: 1,
      padding: '5%',
      gap: 5,
    },
    header: {
        fontWeight: 'bold',
        fontSize: 30,
    },
});

export default Settings;