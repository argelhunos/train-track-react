import {View, Text, StyleSheet, TouchableNativeFeedback, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { getItem, setItem } from '../utils/AsyncStorage';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar';
import LineName from '../components/LineName';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import MapView, {Polyline, Marker} from 'react-native-maps';
import { PROVIDER_GOOGLE } from 'react-native-maps';
import { barrieCoordinates, kitchenerCoordinates, lakeshoreEastCoordinates, lakeshoreWestCoordinates, miltonCoordinates, richmondHillCoordinates, stouffvilleCoordinates } from '../utils/coordinates';
import trainStops from '../utils/trainStops';

const Stack = createStackNavigator();

const trainPolylines = [
  { coordinates: kitchenerCoordinates, strokeColor: "#01773C", key: "KI" },
  { coordinates: miltonCoordinates, strokeColor: "#D4600D", key: "MI" },
  { coordinates: lakeshoreWestCoordinates, strokeColor: "#B21E43", key: "LW" },
  { coordinates: lakeshoreEastCoordinates, strokeColor: "#E22426", key: "LE" },
  { coordinates: barrieCoordinates, strokeColor: "#1657A7", key: "BR" },
  { coordinates: richmondHillCoordinates, strokeColor: "#1795C6", key: "RH" },
  { coordinates: stouffvilleCoordinates, strokeColor: "#8C5823", key: "ST" }
];

function DefaultStop({ route }) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [defaultStop, setDefaultStop] = useState("");
    const mapRef = useRef(null);

    const animateToStation = (stationName) => {
      const station = trainStops.find(stop => stop.title === stationName).coordinate;

      mapRef.current.animateToRegion(
        {
          latitude: station.latitude,
          longitude: station.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421
        }
      );
    }

    const handleMarkerPress = async (stop, event) => {
      if (!stop) {
        return;
      }

      try {
        await setItem('stop', event._targetInst.return.key);
        await setDefaultStop(event._targetInst.return.key);
        await setItem('line', stop.line)
      } catch (error) {
        console.error(error);
      }
    }

    useEffect(() => {
      const fetchCurrentStop = async () => {
        try {
          const currentStop = await getItem('stop');
          setDefaultStop(currentStop);

          if (result != null) {
            animateToStation(currentStop);
          }
        } catch (error) {
          console.error(error);
        }
      }

      fetchCurrentStop();
    }, []);

    // effect to monitor update from modal
    useEffect(() => {
      // note to self: REMEMBER IF THERE IS NO CHANGE, YOU'RE WASTING CYCLES!!
      const handleDefaultStopUpdate = async () => {
        const { stationName, lineName } = route.params || {}; // this is cool keep doing stuff like this

        if (!stationName || !lineName) {
          return;
        }
  
        try {
          
        } catch (error) {
          
        }
      }

      if (route.params?.stationName && route.params?.lineName) {
        setItem('stop', route.params?.stationName)
          .then(setDefaultStop(route.params?.stationName))
          .then(setItem('line', route.params?.lineName))
          .then(animateToStation(route.params?.stationName));
      }
    }, [route.params?.stationName, route.params?.lineName])

    return (
        <View style={{
            ...styles.screenContainer,
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom + 200,
        }}>
            <FocusAwareStatusBar barStyle="light-content" /> 
            <View style={styles.container}>
                <Pressable onPress={() => navigation.goBack()}>
                  <LineName 
                      lineName="Default Stop"
                      lineColour="#CECECD"
                      icon={<MaterialIcons name="arrow-back" size={50} color="black" />}
                  />
                </Pressable>
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
                        {trainPolylines.map(trainLine => 
                          <Polyline coordinates={trainLine.coordinates} strokeColor={trainLine.strokeColor} strokeWidth={5} key={trainLine.key}/>
                        )}
                        {trainStops.map(stop => 
                            <Marker
                                title={stop.title}
                                coordinate={stop.coordinate}
                                key={stop.title}
                                onPress={(event) => handleMarkerPress(stop, event)}
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
    screenContainer: {
      flex: 1,
      backgroundColor: '#fff',
    },
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