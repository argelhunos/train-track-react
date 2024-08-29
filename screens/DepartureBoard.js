import { ScrollView, StyleSheet, Text, View } from 'react-native';
import getNextService from '../services/apiService';
import { useEffect, useState } from 'react';
import LineName from '../components/LineName';
import DepartureCard from '../components/Departure';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

function DepartureBoard() {
    const [loading, setLoading] = useState(false);
    const [tripTimes, setTripTimes] = useState([]);
    const insets = useSafeAreaInsets();

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
        </View>
        <StatusBar style='auto'/>
      </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
    padding: '5%',
  },
});

export default DepartureBoard;