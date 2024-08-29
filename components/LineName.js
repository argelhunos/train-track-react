import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

function LineName({lineName, stationName}) {
    return (
        <View>
            <View style={styles.container}>
                <MaterialIcons name='train' size={50} color="black"/>
                <Text style={lineBadgeStyles.container}>KI</Text>
                <Text style={lineNameStyles.container}>{lineName}</Text>
            </View>
            <Text>{`@ ${stationName}`}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
});

const lineBadgeStyles = StyleSheet.create({
    container: {
        backgroundColor: '#00863E',
        color: 'white',
        paddingHorizontal: '5%',
        paddingVertical: '2%',
        borderRadius: 25,
        fontWeight: '800',
        fontSize: 20,
    },
});

const lineNameStyles = StyleSheet.create({
    container: {
        fontWeight: '500',
        fontSize: 25,
        paddingLeft: "2%",
    },
});

export default LineName;