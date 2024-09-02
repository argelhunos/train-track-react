import { ScrollView, StyleSheet, Text, View } from 'react-native';
import getNextService from '../services/apiService';
import { useEffect, useState } from 'react';
import LineName from '../components/LineName';
import DepartureCard from '../components/Departure';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { getItem } from '../utils/AsyncStorage';

function DepartureBoard() {
    const [loading, setLoading] = useState(false);
    const [tripTimes, setTripTimes] = useState([]);
    const [line, setLine] = useState("");
    const [stop, setStop] = useState("");
    const insets = useSafeAreaInsets();

    useEffect(() => {
        setLoading(true);

        getItem('line')
          .then(data => {
            setLine(data);
          });
        
        getItem('stop')
          .then(data => {
            setStop(data);
          });

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
          <LineName lineName={line} stationName={stop}/>
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