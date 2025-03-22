import { ScrollView, StyleSheet, ActivityIndicator, View, Text, RefreshControl } from 'react-native';
import { getNextService, getSchedule } from '../services/apiService.js'
import { useCallback, useState } from 'react';
import LineName from '../components/LineName.jsx';
import DepartureCard from '../components/Departure.jsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getItem } from '../utils/AsyncStorage.js';
import { lineAbbreviation, lineColour } from '../data/titleAttributes.js';
import { useFocusEffect } from '@react-navigation/native';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar.jsx';

function DepartureBoard({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [tripTimes, setTripTimes] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toTimeString());
    const [line, setLine] = useState("");
    const [stop, setStop] = useState("");
    const insets = useSafeAreaInsets();

    const loadDepartures = async () => {
      try {
        setLoading(true);
        
        const currentLine = await getItem('line');
        setLine(currentLine);

        const currentStop = await getItem('stop');
        setStop(currentStop);

        const tripTimes = await getNextService();
        setTripTimes(tripTimes);
        setRefreshing(false);
        setCurrentTime(new Date().toTimeString());
      } catch (error) {
        console.log("Error occured loading departures: ", error);
        setLoading(false);
        setRefreshing(false);
        setCurrentTime(new Date().toTimeString());
      }
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
            contentContainerStyle={{
              display: 'flex',
              rowGap: 15
            }}
          >
            {/* != for XOR */}
            {loading != refreshing ? <ActivityIndicator size="large" /> : 
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