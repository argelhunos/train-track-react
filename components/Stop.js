import { Text, View, StyleSheet } from 'react-native';

function Stop({station, departureTime, platform}) {
    return (
        <View style={styles.container}>
            <Text>{station}</Text>
            <Text>{`${departureTime} - Platform ${platform}`}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    }, 
});

export default Stop;