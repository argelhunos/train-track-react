import { StyleSheet, Text, View, TouchableNativeFeedback, Platform } from 'react-native';
import { useState } from 'react';
import { getSchedule } from '../services/apiService';

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
            onPress={handleTouch}
        >
            <View style={styles.parentContainer}>
                <View style={styles.container}>
                    <View style={styles.timePlatform}>
                        <Text style={styles.timeText}>{time}</Text>
                        <Text>{`Platform ${platform}`}</Text>
                    </View>
                    <View>
                        <Text>{`to ${destination}`}</Text>
                    </View>
                </View>
                {expanded && !loadingMoreInfo ?
                    tripStops.map(stop => 
                        <Text>{stop.Station}</Text>
                    )
                    : <></>
                }
            </View>
        </TouchableNativeFeedback>
    )
}

const styles = StyleSheet.create({
    parentContainer: {
        backgroundColor: '#dee4d8',
        minWidth: '80%',
        marginBottom: '5%',
        padding: '5%',
        borderRadius: 20,
    },
    container: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#dee4d8',
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
        flex: 1,
    }
});

export default DepartureCard;