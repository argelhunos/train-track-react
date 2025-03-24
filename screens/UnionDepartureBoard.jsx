import { ScrollView, StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { getUnionDepartures } from '../services/apiService.js'
import { useEffect, useState } from 'react';
import DepartureCard from '../components/Departure.jsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LineName from '../components/LineName.jsx';
import FocusAwareStatusBar from '../components/FocusAwareStatusBar.jsx';
import LoadError from '../components/LoadError.jsx';

function UnionDepartureBoard({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [tripTimes, setTripTimes] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleDateString("en-CA"));
    const [error, setError] = useState(null);
    const insets = useSafeAreaInsets();

    const loadDepartures = async () => {
      setLoading(true);

      try {
        const unionDepartures = await getUnionDepartures();
        setTripTimes(unionDepartures);
      } catch (error) {
        console.error(error);
        setTripTimes([]);
        setError(error.message);
      } finally {
        setLoading(false);
        setCurrentTime(new Date().toLocaleTimeString("en-CA"));
      }
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
        ...styles.parentContainer,
        paddingTop: insets.top,
        paddingLeft: insets.left,
        paddingRight: insets.right,
        paddingBottom: insets.bottom,
      }}>
        <FocusAwareStatusBar barStyle="light-content" /> 
        <View style={styles.container}>
          <LineName 
            lineName="Union Departures" 
            lineColour="#CECECD"
          />
          <Text>{`Last Updated: ${currentTime}`}</Text>
          <ScrollView
            contentContainerStyle={{
              display: 'flex',
              rowGap: 15
            }}
          >
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
            {error && <LoadError errorMsg={error} onReload={null} />}
          </ScrollView>
        </View>
      </View>
    );
}

const styles = StyleSheet.create({
  parentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    gap: 10
  },
  container: {
    flex: 1,
    gap: 10,
    paddingHorizontal: '5%',
    paddingTop: '5%',
  },
});

export default UnionDepartureBoard;