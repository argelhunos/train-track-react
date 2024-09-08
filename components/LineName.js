import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet, Text, View } from 'react-native';

function LineName({lineName, stationName, lineAbbreviation, lineColour}) {
    return (
        <View>
            <View style={styles.container}>
                <MaterialIcons name='train' size={50} color="black"/>
                <Text style={{
                    backgroundColor: lineColour,
                    color: 'white',
                    paddingHorizontal: '5%',
                    paddingVertical: '2%',
                    borderRadius: 25,
                    fontWeight: '800',
                    fontSize: 20,
                }}>{lineAbbreviation}</Text>
                <Text style={styles.lineName}>{lineName}</Text>
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
    lineName: {
        fontWeight: '500',
        fontSize: 25,
        paddingLeft: "2%",
    }
});

export default LineName;