import { ScrollView, StyleSheet, ActivityIndicator, View, Text, RefreshControl } from 'react-native';
import { getNextService, getSchedule } from '../services/apiService.js'
import { useCallback, useEffect, useState } from 'react';
import LineName from '../components/LineName.jsx';
import DepartureCard from '../components/Departure.jsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getItem } from '../utils/AsyncStorage.js';
import { lineAbbreviation, lineColour } from '../data/titleAttributes.js';
import { useFocusEffect } from '@react-navigation/native';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar.jsx';
import LoadError from '../components/LoadError.jsx';

function DepartureBoard({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [tripTimes, setTripTimes] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleDateString("en-CA"));
    const [line, setLine] = useState("");
    const [stop, setStop] = useState("");
    const [error, setError] = useState(null);
    const insets = useSafeAreaInsets();

    const loadDepartures = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentLine = await getItem('line');
        setLine(currentLine);

        const currentStop = await getItem('stop');
        setStop(currentStop);

        const tripTimes = await getNextService();
        setTripTimes(tripTimes);
        setLoading(false);
        setRefreshing(false);
        setCurrentTime(new Date().toLocaleTimeString("en-CA"));
      } catch (error) {
        console.log("Error occured loading departures: ", error);
        setTripTimes([]);
        setLoading(false);
        setRefreshing(false);
        setCurrentTime(new Date().toLocaleDateString("en-CA"));
        setError(error.message);
      }
    }
    // useFocusEffect instead of useEffect to update during each focus, so it is always using updated user line/stop preferences
    useFocusEffect( 
      useCallback(() => {
        async function loadDeparturesOnFocus() {
          try {
            const savedLine = await getItem('line');
            const savedStop = await getItem('stop');
            
            if (!savedLine || !savedStop) {
              navigation.navigate('Settings');
              return;
            }
            
            // only refresh when line and stop has changed.
            if (savedLine === line && savedStop === stop) {
              return;
            }
  
            loadDepartures();
  
          } catch (error) {
            console.log("An error occured loading departures: ", error);
          }
        }

        loadDeparturesOnFocus();
      })
    );

    const onRefresh = () => {
      setRefreshing(true);
      loadDepartures();
    }

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
          <FocusAwareStatusBar barStyle="light-content" /> 
          <LineName 
            lineName={line} 
            stationName={stop} 
            lineAbbreviation={lineAbbreviation.get(line) || ""}
            lineColour={lineColour.get(line) || "#000"}
          />
          <Text>Last Updated: {currentTime}</Text>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>    
            }
            contentContainerStyle={{
              display: 'flex',
              rowGap: 15
            }}
          >
            {loading ? <ActivityIndicator size="large" /> : 
              tripTimes.length != 0 ?
              tripTimes.map((trip, index) => (
                <DepartureCard
                  platform={trip.DisplayedPlatform}
                  time={trip.DisplayedDepartureTime}
                  destination={trip.DirectionName}
                  key={trip.TripNumber}
                  tripNumber={trip.TripNumber}
                  isDelayed={trip.Delayed}
                />
              )) : <Text>No departures found.</Text>
            }
            {error && <LoadError errorMsg={error} onReload={onRefresh}/>}
          </ScrollView>
        </View>
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

export default DepartureBoard;