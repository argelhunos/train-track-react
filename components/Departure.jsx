import { StyleSheet, Text, View, TouchableNativeFeedback, Platform, LayoutAnimation } from 'react-native';
import { useEffect, useState } from 'react';
import { getCurrentTripInfo, getMergedTripDetails, getMergedUnionTripDetails } from '../services/apiService';
import Stop from './Stop';
import { unionLineColour } from '../data/titleAttributes';

function DepartureCard ({platform, time, destination, isDelayed, tripNumber, isUnionDeparture}) {
    const [expanded, setExpanded] = useState(false);
    const [tripStops, setTripStops] = useState([]);
    const [tripInfo, setTripInfo] = useState(null);
    const [loadingMoreInfo, setLoadingMoreInfo] = useState(false);

    useEffect(() => {
        getCurrentTripInfo(tripNumber)
            .then(data => {
                setTripInfo(data)
            })
            .catch((error) => console.log(error))
    }, [])

    const handleTouch = () => {
        setLoadingMoreInfo(true);

        if (expanded) {
            setExpanded(!expanded);
            setLoadingMoreInfo(false);
            return;
        }

        if (isUnionDeparture) {
            getMergedUnionTripDetails(tripNumber)
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
        } else {
            getMergedTripDetails(tripNumber)
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
    }

    return (
        <View style={{borderRadius: 20, overflow: 'hidden'}}>
            <TouchableNativeFeedback
                background={
                    Platform.OS === 'android'
                        ? TouchableNativeFeedback.Ripple('#424242', true)
                        : undefined
                }
                onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    handleTouch();
                }}
                
            >
                <View 
                    style={
                        {
                            ...styles.parentContainer,
                            backgroundColor: isUnionDeparture ? "#EEEAE3" : styles.parentContainer.backgroundColor,
                        }
                    }
                >
                    <View style={styles.container}>
                        <View style={styles.timePlatform}>
                            <Text 
                                style={{
                                    ...styles.timeText,
                                    color: isDelayed ? '#A63232' : 'black',
                                }}
                            >{time}</Text>
                            <Text>
                                {platform}
                                {tripInfo != null && ` - ${tripInfo.Cars} Coaches`}
                            </Text>
                        </View>
                        <View>
                            <Text 
                                style={{
                                    ...styles.destination,
                                    backgroundColor: isUnionDeparture ? unionLineColour.get(destination) : styles.destination.backgroundColor
                                }}
                            >
                                {`${isUnionDeparture ? destination : `to ${destination}`}`}
                            </Text>
                        </View>
                    </View>
                    {expanded && !loadingMoreInfo ?
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
                                    isUnionDeparture={isUnionDeparture}
                                />
                            )}
                            {tripStops.length === 0 && 
                                <Text style={styles.error}>Unable to find further info.</Text>
                            }
                        </View>
                        : <></>
                    }
                </View>
            </TouchableNativeFeedback>
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
    destination: {
        display: 'flex',
        color: 'white',
        fontWeight: '350',
        backgroundColor: '#346a21',
        paddingVertical: '1%',
        paddingHorizontal: '3%',
        borderRadius: 20,
    },
    stops: {
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
    },
    error: {
        fontStyle: 'italic'
    }
});

export default DepartureCard;