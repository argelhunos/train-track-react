import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import getNextService from './services/apiService';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import LineName from './components/LineName';

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
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        <LineName lineName={"Kitchener"} stationName={"Mount Pleasant GO"}/>
        {loading ? "" : 
          tripTimes.map((trip, index) => (
            <View key={trip.ScheduledDepartureTime}>
              <Text>{trip.ScheduledDepartureTime}</Text>
              <Text>{trip.ScheduledPlatform}</Text>
              <Text>{trip.DirectionName}</Text>
            </View>
          ))
        }
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '5%',
  },
});
