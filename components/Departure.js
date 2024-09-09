import { StyleSheet, Text, View, TouchableNativeFeedback, Platform, LayoutAnimation, UIManager } from 'react-native';
import { useState } from 'react';
import { getSchedule } from '../services/apiService';
import Stop from './Stop';

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DepartureCard ({platform, time, destination, tripNumber}) {
    const [expanded, setExpanded] = useState(false);
    const [tripStops, setTripStops] = useState([]);
    const [loadingMoreInfo, setLoadingMoreInfo] = useState(false);

    const handleTouch = () => {
        setLoadingMoreInfo(true);
        getSchedule(tripNumber)
            .then(data => {
                setTripStops(data);
                setLoadingMoreInfo(false);
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpanded(!expanded);
            })
            .catch((error) => {
                console.log(error);
                setLoadingMoreInfo(false);
                setExpanded(!expanded);
            })
    }

    return (
        <TouchableNativeFeedback
            background={
                Platform.OS === 'android'
                    ? TouchableNativeFeedback.SelectableBackground()
                    : undefined
            }
            onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                handleTouch();
            }}
        >
            <View style={styles.parentContainer}>
                <View style={styles.container}>
                    <View style={styles.timePlatform}>
                        <Text style={styles.timeText}>{time}</Text>
                        <Text>{`Platform ${platform}`}</Text>
                    </View>
                    <View>
                        <Text style={styles.destination}>{`to ${destination}`}</Text>
                    </View>
                </View>
                {expanded && !loadingMoreInfo ?
                    <View>
                        {tripStops.map(stop => 
                            <Stop
                                station={stop.Station}
                                departureTime={stop.DepartureTime.Scheduled}
                                platform={stop.Track.Scheduled}
                                key={stop.Station}
                            />
                        )}
                    </View>
                    : <></>
                }
            </View>
        </TouchableNativeFeedback>
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
    destination: {
        display: 'flex',
        color: 'white',
        fontWeight: '350',
        backgroundColor: '#346a21',
        paddingVertical: '1%',
        paddingHorizontal: '3%',
        borderRadius: 20,
    }
});

export default DepartureCard;