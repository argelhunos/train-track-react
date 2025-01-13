import { StyleSheet, Text, View, Platform, LayoutAnimation, UIManager, Pressable, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import { getCurrentTripInfo, getMergedTripDetails, getSchedule } from '../services/apiService';
import Stop from './Stop';
import { lineColour } from '../data/titleAttributes';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function SavedNotification ({time, line, station, isActive}) {
    const [expanded, setExpanded] = useState(false);
    const [notificationActive, setNotificationActive] = useState(isActive ? true : false);

    const onCaretPress = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    }

    const onTogglePress = () => setNotificationActive(!notificationActive);

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
                            <Text style={styles.lineAbbr}>KI</Text>
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
                    <Switch value={notificationActive} onValueChange={onTogglePress}/>
                </View>
            </View>
            {/* {expanded && !loadingMoreInfo ?
                <View style={styles.stops}>
                    {tripStops.map(stop => 
                        <Stop
                            station={stop.Station}
                            departureTime={stop.DepartureTime.Scheduled}
                            platform={stop.Track.Scheduled}
                            key={stop.Station}
                            isFirstStop={stop.isFirstStop}
                            isLastStop={stop.isLastStop}
                            hasVisited={stop.hasVisited}
                        />
                    )}
                    {tripStops.length === 0 && 
                        <Text style={styles.error}>Unable to find further info.</Text>
                    }
                </View>
                : <></>
            } */}
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
    }
});

export default SavedNotification;