import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import getNextService from './services/apiService';
import { useEffect, useState } from 'react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [tripTimes, setTripTimes] = useState([]);

  useEffect(() => {
    setLoading(true);
    getNextService()
      .then(data => {
        setTripTimes(data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
      })
  }, [])

  return (
    <View style={styles.container}>
      <Text>Hello world!</Text>
      {loading ? "" : 
        tripTimes.map((trip, index) => (
          <View>
            <Text>{trip.ScheduledDepartureTime}</Text>
            <Text>{trip.ScheduledPlatform}</Text>
            <Text>{trip.DirectionName}</Text>
          </View>
        ))
      }
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
