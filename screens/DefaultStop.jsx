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
import MapView, {Polyline, Marker} from 'react-native-maps';
import { PROVIDER_GOOGLE } from 'react-native-maps';
import { barrieCoordinates, kitchenerCoordinates, lakeshoreEastCoordinates, lakeshoreWestCoordinates, miltonCoordinates, richmondHillCoordinates, stouffvilleCoordinates } from '../utils/coordinates';
import trainStops from '../utils/trainStops';

const Stack = createStackNavigator();

function DefaultStop() {
    const insets = useSafeAreaInsets();
    const [stops, setStops] = useState([]);
    const navigation = useNavigation();

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

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#fff',
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom + 150,
        }}>
            <FocusAwareStatusBar barStyle="light-content" /> 
            <View style={styles.container}>
                <LineName 
                    lineName="Default Stop"
                    lineColour="#CECECD"
                    icon={<MaterialIcons name="arrow-back" size={50} color="black" />}
                />
                <View style={styles.mapParentContainer}>
                    <MapView
                        provider={PROVIDER_GOOGLE} 
                        style={styles.map}
                        initialRegion={{
                            latitude: 43.64552152608714,
                            longitude: -79.38049203371342,
                            latitudeDelta: 0.0922,
                            longitudeDelta: 0.0421 
                        }}
                        customMapStyle={mapStyle}
                    >
                        <Polyline
                            coordinates={kitchenerCoordinates}
                            strokeColor="#01773C"
                            strokeWidth={5}
                        />
                        <Polyline 
                            coordinates={miltonCoordinates}
                            strokeColor="#D4600D"
                            strokeWidth={5}
                        />
                        <Polyline 
                            coordinates={lakeshoreWestCoordinates}
                            strokeColor="#B21E43"
                            strokeWidth={5}
                        />
                        <Polyline 
                            coordinates={lakeshoreEastCoordinates}
                            strokeColor="#E22426"
                            strokeWidth={5}
                        />
                        <Polyline 
                            coordinates={barrieCoordinates}
                            strokeColor="#1657A7"
                            strokeWidth={5}
                        />
                        <Polyline 
                            coordinates={richmondHillCoordinates}
                            strokeColor="#1795C6"
                            strokeWidth={5}
                        />
                        <Polyline 
                            coordinates={stouffvilleCoordinates}
                            strokeColor="#8C5823"
                            strokeWidth={5}
                        />
                        {trainStops.map(stop => 
                            <Marker
                                title={stop.title}
                                coordinate={stop.coordinate}
                                key={stop.title}
                                
                            >
                                <View style={styles.mapMarker}></View>
                            </Marker>
                        )}
                    </MapView>
                </View>

                <SelectList 
                    // setSelected={(val) => setSelectedLine(val)}
                    data={trainLineSelections}
                    save="value"
                    onSelect={onLineChange}
                    placeholder={"test"}
                    boxStyles={{
                        backgroundColor: '#EEEAE3',
                    }}
                />

                {/* {selectedLine ? 
                    <SelectList 
                        // setSelected={(val) => setSelectedStop(val)}
                        data={stops}
                        save='value'
                        onSelect={onStopChange}
                        boxStyles={{
                            backgroundColor: '#EEEAE3',
                        }}
                    /> :
                    <></>
                } */}
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
    },
    mapParentContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        overflow: 'hidden'
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapMarker: {
        width: 15,
        height: 15,
        backgroundColor: '#FFFFFF',
        borderColor: '#000000',
        borderStyle: 'solid',
        borderWidth: 3,
        borderRadius: 10,
        marginTop: 30
    }
});

const mapStyle = [
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.local",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels",
      "stylers": [
        {
          "visibility": "off"
        }
      ]
    }
];

export default DefaultStop;