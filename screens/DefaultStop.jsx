import {View, Text, StyleSheet, Image, TouchableNativeFeedback, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SelectList } from 'react-native-dropdown-select-list';
import { useEffect, useRef, useState } from 'react';
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

function DefaultStop({ route }) {
    const insets = useSafeAreaInsets();
    const [stops, setStops] = useState([]);
    const navigation = useNavigation();
    const [defaultStop, setDefaultStop] = useState("");
    const mapRef = useRef(null);

    const animateToStation = (stationName) => {
      mapRef.current.animateToRegion(
        {
          latitude: trainStops.find(stop => stop.title === stationName).coordinate.latitude,
          longitude: trainStops.find(stop => stop.title === stationName).coordinate.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }
      );
    }

    useEffect(() => {
      getItem("stop")
        .then(result => {
          setDefaultStop(result);
          if (result != null) {
            animateToStation(result);
          }
        })
    }, []);

    // effect to monitor update from modal
    useEffect(() => {
      if (route.params?.stationName && route.params?.lineName) {
        setItem('stop', route.params?.stationName)
          .then(setDefaultStop(route.params?.stationName))
          .then(setItem('line', route.params?.lineName))
          .then(animateToStation(route.params?.stationName));
      }
    }, [route.params?.stationName, route.params?.lineName])

    return (
        <View style={{
            flex: 1,
            backgroundColor: '#fff',
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom + 200,
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
                        ref={mapRef}
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
                        {/* probably want to change this to a .map one day */}
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
                                onPress={(e) => {
                                  setItem('stop', e._targetInst.return.key)
                                    .then(setDefaultStop(e._targetInst.return.key))
                                    return setItem('line', stop.line);
                                }}
                                id={stop.title}
                            >
                                <View style={
                                  {
                                    ...styles.mapMarker,
                                    backgroundColor: stop.title === defaultStop ? "#FFD700" : styles.mapMarker.backgroundColor
                                  }
                                }
                                ></View>
                            </Marker>
                        )}
                    </MapView>
                </View>
                <Text style={styles.sectionTitle}>Your stop:</Text>
                <TouchableNativeFeedback
                  background={
                    Platform.OS === 'android'
                    ? TouchableNativeFeedback.SelectableBackground()
                    : undefined
                  }
                  onPress={() => navigation.navigate("Default Stop Modal")}
                >
                  <View style={styles.stopSelector}>
                    <MaterialIcons name='location-pin' size={25} color="#4B8511" />
                    <Text style={styles.stopSelectorText}>{defaultStop}</Text>
                  </View>
                </TouchableNativeFeedback>
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
    },
    stopSelector: {
      display: 'flex',
      width: '100%',
      padding: 15,
      backgroundColor: '#DADFD5',
      borderRadius: 20,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center'
    },
    stopSelectorText: {
      fontSize: 15
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