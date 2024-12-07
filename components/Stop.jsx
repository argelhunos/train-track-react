import { Text, View, StyleSheet } from 'react-native';

function Stop({station, departureTime, platform, isFirstStop, isLastStop, hasVisited}) {
    return (
        <View style={styles.container}>
            <View style={styles.platformName}>
                {(!isLastStop && !isFirstStop) && 
                    <View style={{
                        ...styles.bar,
                        backgroundColor: hasVisited ? "#346A21" : "black",
                    }}></View>
                }
                <View 
                    style={{
                        ...styles.circle,
                        backgroundColor: hasVisited ? "#346A21" : "black"
                    }}
                ></View>
                <Text
                    style={{
                        fontSize: isFirstStop || isLastStop ? 16 : 15,
                        fontWeight: isFirstStop || isLastStop ? 800 : 400,
                    }}
                >{station}</Text>
            </View>
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
    platformName: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    circle: {
        backgroundColor: 'black',
        width: 8,
        height: 8,
        borderRadius: 20,
    },
    bar: {
        width: 4,
        height: 40,
        backgroundColor: 'black',
        position: 'absolute',
        left: 2,
    } 
});

export default Stop;