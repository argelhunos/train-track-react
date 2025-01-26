import { StyleSheet, Text, View, Platform, LayoutAnimation, UIManager, Pressable, Switch, TouchableNativeFeedback } from 'react-native';
import { useEffect, useState } from 'react';
import { getCurrentTripInfo, getMergedTripDetails, getSchedule } from '../services/apiService';
import Stop from './Stop';
import { lineAbbreviation, lineColour } from '../data/titleAttributes';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as SQLite from 'expo-sqlite';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const toggleNotificationActive = async (id) => {
    try {
        const db = await SQLite.openDatabaseAsync("notifications");
        const result = await db.runAsync(`UPDATE notifications SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE id = ?;`, id);
        console.log("Notification toggled");
        const allRows = await db.getAllAsync('SELECT * FROM notifications');
        console.log(allRows);
    } catch (error) {
        console.log(error);
    }
}

function SavedNotification ({time, line, station, isActive, id, deleteMethod}) {
    const [expanded, setExpanded] = useState(false);
    const [notificationActive, setNotificationActive] = useState(isActive ? true : false);

    const onCaretPress = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    }

    const onTogglePress = (id) => {
        toggleNotificationActive(id)
            .then(() => { setNotificationActive(!notificationActive) })
            .catch((error) => console.log(error));
    }

    return (
        <View style={styles.parentContainer}>
            <View style={styles.container}>
                <View style={styles.timePlatform}>
                    <Text style={styles.timeText}>{time}</Text>
                    <View style={styles.tripInfo}>
                        <View style={
                            {
                                ...styles.lineAbbrContainer,
                                backgroundColor: lineColour.get(line),
                            }
                        }>
                            <Text style={styles.lineAbbr}>{lineAbbreviation.get(line)}</Text>
                        </View>
                        <Text>
                            {line} - {station}
                        </Text>
                    </View>
                </View>
                <View style={styles.caretSwitchContainer}>
                    <Pressable 
                        style={styles.caret}
                        onPress={onCaretPress}
                    >
                        {expanded 
                            ? <MaterialIcons name="keyboard-arrow-up" size={24} color="white"/> 
                            : <MaterialIcons name="keyboard-arrow-down" size={24} color="white" 
                        />}
                    </Pressable>
                    <Switch value={notificationActive} onValueChange={() => onTogglePress(id)}/>
                </View>
            </View>
            {expanded && 
                <View style={styles.expandedOptionsList}>
                    <TouchableNativeFeedback>
                        <View style={styles.expandedOptions}>
                            <MaterialIcons name="edit" size={24} color="black" />
                            <Text>Edit Line and Station</Text>
                        </View>
                    </TouchableNativeFeedback>
                    <TouchableNativeFeedback
                        onPress={() => deleteMethod(id)}
                    >
                        <View style={styles.expandedOptions}>
                            <MaterialIcons name="delete" size={24} color="black" />
                            <Text>Delete</Text>
                        </View>
                    </TouchableNativeFeedback>
                </View>
            }
        </View>        
    )
}

const styles = StyleSheet.create({
    parentContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        backgroundColor: '#dee4d8',
        minWidth: '80%',
        marginBottom: '5%',
        padding: '5%',
        borderRadius: 20,
    },
    container: {
        display: 'flex',
        flexDirection: 'row',
        minWidth: '80%',
    },
    timePlatform: {
        display: 'flex',
        flex: 2,
        flexDirection: 'column',
    },
    timeText: {
        fontSize: 40,
    },
    caret: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2E5339',
        borderRadius: 50,
        width: 25,
        height: 25,
    },
    caretSwitchContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        flex: 1,
        justifyContent: 'space-between'
    },
    tripInfo: {
        display: 'flex',
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'flex-start',
        alignItems: 'center'
    },
    lineAbbrContainer: { 
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 25,
    },
    lineAbbr: {
        color: 'white',
        fontWeight: '800'
    },
    expandedOptionsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
    },
    expandedOptions: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    }
});

export default SavedNotification;