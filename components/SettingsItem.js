import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

function SettingsItem({img, bgimg, text}) {
    return (
        <View style={styles.container}>
            <View style={{
                ...styles.image,
                backgroundColor: bgimg
            }}>
                {img}
            </View>
            <Text style={styles.selectionName}>{text}</Text>
            <View style={styles.arrowButton}>
                <MaterialIcons name="arrow-forward" size={24} color="black" />  
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        minWidth: '80%',
        justifyContent: 'space-between',
        gap: 20
    },
    selectionName: {
        fontWeight: '400',
        fontSize: 18,
        flex: 2
    },
    image: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 75,
        height: 75,
        borderRadius: 20
    },
    arrowButton: {
        backgroundColor: '#EEEAE3',
        padding: 10,
        borderRadius: 30
    }
});

export default SettingsItem;