import { ScrollView, StyleSheet, ActivityIndicator, View, Text, RefreshControl } from 'react-native';
import { getNextService, getSchedule } from '../services/apiService.js'
import { useCallback, useState } from 'react';
import LineName from '../components/LineName';
import DepartureCard from '../components/Departure';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getItem } from '../utils/AsyncStorage';
import { lineAbbreviation, lineColour } from '../data/titleAttributes';
import { useFocusEffect } from '@react-navigation/native';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar.js';

function DepartureBoard({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [tripTimes, setTripTimes] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toTimeString());
    const [line, setLine] = useState("");
    const [stop, setStop] = useState("");
    const insets = useSafeAreaInsets();

    const loadDepartures = () => {
      setLoading(true);
      getItem('line')
        .then(data => {
          setLine(data);
          return getItem('stop');
        })
        .then(data => {
          setStop(data);
          return getNextService();
        })
        .then(data => {
          setTripTimes(data);
          setLoading(false);
          setRefreshing(false);
          setCurrentTime(new Date().toTimeString());
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
          setRefreshing(false);
          setCurrentTime(new Date().toTimeString());
        })
    }

    // useFocusEffect instead of useEffect to update during each focus, so it is always using updated user line/stop preferences
    useFocusEffect(
      useCallback(() => {
        let oldUserLine;
        let oldUserStop;

        // if there is no line set, force user to go to settings
        getItem('line')
          .then(data => {
            if (!data) {
              navigation.navigate('Settings');
            }

            // temporarily store for checking for changes with settings
            
            oldUserLine = data;

            return getItem('stop');
          })
          .then(data => {

            oldUserStop = data;

            if (!data) {
              navigation.navigate('Settings');
            }
          })
          .finally(() => {
            // only refresh when line and stop has changed.
            if (oldUserLine === line && oldUserStop === stop) {
              return;
            } else {
              loadDepartures(); 
            }
          })
      }, [stop, line])
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
            lineAbbreviation={lineAbbreviation.get(line)}
            lineColour={lineColour.get(line)}
          />
          <Text>Last Updated: {new Date().toTimeString()}</Text>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>    
            }
          >
            {/* != for XOR */}
            {loading != refreshing ? <ActivityIndicator size="large" /> : 
              tripTimes.length != 0 ?
              tripTimes.map((trip, index) => (
                <DepartureCard
                  platform={trip.DisplayedPlatform}
                  time={trip.DisplayedDepartureTime}
                  destination={trip.DirectionName}
                  key={trip.ScheduledDepartureTime}
                  tripNumber={trip.TripNumber}
                  isDelayed={trip.Delayed}
                />
              )) : <Text>No departures found.</Text>
            }
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