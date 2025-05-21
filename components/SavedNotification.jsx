import { StyleSheet, Text, View, LayoutAnimation, Pressable, Switch } from 'react-native';
import { useState } from 'react';
import { lineAbbreviation, lineColour } from '../data/titleAttributes';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { toggleNotification } from '../services/notificationsService';
import SavedNotificationOptionsMenu from './SavedNotificationOptionsMenu';

function SavedNotification ({notification, deleteMethod}) {
    const { time, line, stop, isActive, id } = notification;
    const [expanded, setExpanded] = useState(false);
    const [notificationActive, setNotificationActive] = useState(isActive);
    const navigation = useNavigation();

    const onCaretPress = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
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
                            {line} - {stop}
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
                    <Switch 
                        value={notificationActive} 
                        onValueChange={() => toggleNotification(id, setNotificationActive)}
                        trackColor={{ false: "#767577", true: "#B2B8AD" }}
                        thumbColor={notificationActive ? "#4E8D61" : "#f4f3f4"}
                    />
                </View>
            </View>
            {expanded && 
                <SavedNotificationOptionsMenu notification={notification} deleteMethod={deleteMethod}/>
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
});

export default SavedNotification;