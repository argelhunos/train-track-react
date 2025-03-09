import { View, StyleSheet, Text, Pressable } from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectList } from "react-native-dropdown-select-list";
import { trainLineSelections } from "../data/dropdownOptions";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import { getStopsWithLine } from "../data/dropdownOptions";

function NotificationsModal({route}) {
    const { editMode = false, id, line = '', stop = '', time = '00:00'} = route.params || {}; // or empty object if no params to handle undefined
    const insets = useSafeAreaInsets();
    const [selectedLine, setSelectedLine] = useState(line);
    const [selectedStop, setSelectedStop] = useState(stop);
    const [stops, setStops] = useState([]);
    const navigation = useNavigation();
    let defaultDate = new Date(0);

    if (editMode) {
        defaultDate.setHours(time.split(":")[0]);
        defaultDate.setMinutes(time.split(":")[1]);
    } else {
        defaultDate.setHours(0,0,0,0);
    }

    const [date, setDate] = useState(defaultDate);
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);

    const onLineChange = () => {
        // update stops each time the line changes
        getStopsWithLine(selectedLine)
            .then(data => setStops(data));
    }

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShow(false);
        setDate(currentDate);
    };

    const onSubmit = () => {
        console.log(selectedLine, selectedStop, date);
        
        // only navigate if all fields are filled on notification creation
        if (selectedLine && selectedStop && date !== defaultDate) {
            console.log(selectedLine, selectedStop, date);
            navigation.navigate("Notifications", {
                line: selectedLine,
                stop: selectedStop,
                time: formatDate(date),
                isEditMode: editMode,
                id: id
            });
        } else if (editMode) {
            // double check if this is needed
            console.log(selectedLine, selectedStop, date);
            navigation.navigate("Notifications", {
                line: selectedLine,
                stop: selectedStop,
                time: formatDate(date),
                isEditMode: editMode,
                id: id
            });
        }
    };

    const showMode = (currentMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
    };

    const showTimepicker = () => {
        showMode('time');
    };

    const formatDate = (date) => {
        let hours = date.getHours();
        let minutes = date.getMinutes();
        minutes = minutes < 10 ? '0' + minutes : minutes;

        return `${hours}:${minutes}`;
    }
        
    return (
        <View style={styles.container}>
            <View
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right,
                    justifyContent: 'center',
                    alignItems: 'center'                    
                }}
            >
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Set Notification</Text>
                    <Text style={styles.sectionTitle}>Line</Text>
                    <SelectList
                        data={trainLineSelections}
                        setSelected={item => setSelectedLine(item)}
                        onSelect={() => onLineChange()}
                        save="value"
                        defaultOption={selectedLine}
                    />
                    <Text style={styles.sectionTitle}>Station</Text>
                    <SelectList 
                        data={stops}
                        setSelected={item => setSelectedStop(item)}
                        save="value"
                        defaultOption={selectedStop}
                    />
                    <Text style={styles.sectionTitle}>Set Time</Text>
                    <View style={styles.timeSetter}>
                        <Pressable>
                            <Text style={styles.time}>{formatDate(date)}</Text>
                        </Pressable>
                        <Pressable 
                            style={styles.editTimeButton}
                            onPress={showTimepicker}
                        >
                            <MaterialIcons name="edit" size={20}/>
                        </Pressable> 
                    </View>
                    <View style={styles.formButtons}>
                        <Pressable onPress={() => navigation.goBack()}>
                            <Text>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={onSubmit}>
                            <Text>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
            {show && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode={mode}
                    is24Hour={true}
                    onChange={onChange}
                />
            )}
        </View>

    )
}

const styles = StyleSheet.create({
    container: {
        padding: '5%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modal: {
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        backgroundColor: '#FFFFFF',
        padding: '5%',
        borderRadius: 20,
        width: '80%'
    },
    timeSetter: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    time: {
        fontSize: 40
    },
    modalTitle: {
        fontWeight: '500',
        fontSize: 25
    },
    sectionTitle: {
        fontWeight: '500',
        fontSize: 15
    },
    editTimeButton: {
        backgroundColor: '#7cab84',
        padding: 10,
        borderRadius: 50
    },
    formButtons: {
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        alignSelf: 'flex-end'
    }
});

export default NotificationsModal;