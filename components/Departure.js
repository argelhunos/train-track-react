import { StyleSheet, Text, View } from 'react-native';

function DepartureCard ({platform, time, destination}) {
    return (
        <View style={styles.container}>
            <View style={styles.timePlatform}>
                <Text style={styles.timeText}>{time}</Text>
                <Text>{`Platform ${platform}`}</Text>
            </View>
            <View>
                <Text>{`to ${destination}`}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#dee4d8',
        minWidth: '80%',
        padding: '5%',
        marginBottom: '5%',
        borderRadius: 20,
    },
    timePlatform: {
        display: 'flex',
        flex: 2,
        flexDirection: 'column',
    },
    timeText: {
        fontSize: 40,
    },  
    destination: {
        display: 'flex',
        flex: 1,
    }
});

export default DepartureCard;