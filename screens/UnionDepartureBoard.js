import { ScrollView, StyleSheet, ActivityIndicator, View, Text, RefreshControl } from 'react-native';
import { getNextService, getSchedule, getUnionDepartures } from '../services/apiService.js'
import { useCallback, useEffect, useState } from 'react';
import DepartureCard from '../components/Departure';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getItem } from '../utils/AsyncStorage';
import { lineAbbreviation, lineColour } from '../data/titleAttributes';
import { useFocusEffect } from '@react-navigation/native';
import LineName from '../components/LineName';

function UnionDepartureBoard({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [tripTimes, setTripTimes] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date().toTimeString());
    const insets = useSafeAreaInsets();

    const loadDepartures = () => {
      setLoading(true);
      getUnionDepartures()
        .then(data => {
            setTripTimes(data);
            setLoading(false);
            setCurrentTime(new Date().toTimeString());
        })
        .catch((error) => {
            console.log(error);
            setLoading(false);
            setCurrentTime(new Date().toTimeString());
        })
    }

    useEffect(() => {
        loadDepartures();

        const interval = setInterval(() => {
          loadDepartures();
        }, 60*1000);
        return () => clearInterval(interval);
    }, [])

    return (
      <View style={{
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
        gap: 10,
      }}>
        <View style={styles.container}>
          <LineName 
            lineName="Union Departures" 
            lineColour="#CECECD"
          />
          <Text>{`Last Updated: ${currentTime}`}</Text>
          <ScrollView>
            {loading ? <ActivityIndicator size="large" /> : 
              tripTimes.length != 0 ?
              tripTimes.map((trip, index) => (
                <DepartureCard
                  platform={trip.Platform}
                  time={trip.DisplayedDepartureTime}
                  destination={trip.Service}
                  key={trip.TripNumber}
                  tripNumber={trip.TripNumber}
                  isDelayed={false}
                  isUnionDeparture={true}
                />
              )) : <Text>No departures found.</Text>
            }
          </ScrollView>
        </View>
        <StatusBar style='auto'/>
      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
    paddingHorizontal: '5%',
    paddingTop: '5%',
  },
});

export default UnionDepartureBoard;