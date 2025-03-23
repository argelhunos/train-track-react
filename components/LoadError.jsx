import { StyleSheet, Text, View, Button } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

function LoadError({ errorMsg, onReload }) {
    return (
        <View style={styles.parentContainer}>
            <MaterialIcons name="error" size={50} color="black"/> 
            <Text>An error occured while loading departures.</Text>
            <Text>{errorMsg}</Text>
            <Button title="Retry" color={"#CECECD"} onPress={onReload}></Button>
        </View>
    )
}

const styles = StyleSheet.create({
    parentContainer: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FAA0A0',
        padding: 10,
        marginHorizontal: 'auto',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        gap: 5
    }
});

export default LoadError;