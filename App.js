import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import getNextService from './services/apiService';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    getNextService()
  }, [])

  return (
    <View style={styles.container}>
      <Text>Hello world!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
