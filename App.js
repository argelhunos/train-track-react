import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import getNextService from './services/apiService';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import LineName from './components/LineName';
import DepartureCard from './components/Departure';

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
        <ScrollView>
          {loading ? "" : 
            tripTimes.map((trip, index) => (
              <DepartureCard
                platform={trip.ScheduledPlatform}
                time={trip.ScheduledDepartureTime}
                destination={trip.DirectionName}
                key={trip.ScheduledDepartureTime}
              />
            ))
          }
        </ScrollView>
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
    gap: 10,
  },
});
