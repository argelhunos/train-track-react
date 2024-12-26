import { StyleSheet, Text, TouchableNativeFeedback, View, Platform, LayoutAnimation, UIManager, FlatList } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from "react";
import { lineColour } from "../data/titleAttributes";
import { useNavigation } from "@react-navigation/native";

if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

function DefaultStopLineItem({lineName, stations}) {
    const [active, setActive] = useState(false);
    const navigation = useNavigation();

    const onLinePress = () => {
        setActive(!active);    
    }

    const onStationPress = (stationItem) => {
        const stationName = stationItem.title;
        const lineName = stationItem.id.split("-")[1];

        navigation.navigate("Default Stop", {
            stationName: stationName,
            lineName: lineName
        });
    }

    return (
        <View>
            <TouchableNativeFeedback
                background={
                    Platform.OS === 'android'
                    ? TouchableNativeFeedback.SelectableBackground()
                    : undefined
                }
                onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    onLinePress();
                }}
            >
                <View>
                    <View style={styles.lineItem}>
                        <Text style={styles.lineName}>{lineName}</Text>
                        <MaterialIcons name="keyboard-arrow-down" size={24} color="black" style={active ? styles.activeItem : styles.inactiveItem}/>
                    </View>
                </View>
            </TouchableNativeFeedback>
            {active && 
                <FlatList
                    data={stations}
                    renderItem={({item}) =>
                        <TouchableNativeFeedback
                            onPress={() => onStationPress(item)}
                        >
                            <View style={styles.station}>
                                <View style={
                                    {
                                        ...styles.stationIcon,
                                        backgroundColor: lineColour.get(item.id.substring(0, 2))
                                    }
                                }>
                                    <Text style={styles.stationIconText}>{item.id.substring(0, 2)}</Text>
                                </View>
                                <Text>{item.title}</Text>
                            </View>
                        </TouchableNativeFeedback>
                    }
                    keyExtractor={item => item.id}
                />
            }
        </View>
    )
}

const styles = StyleSheet.create({
    lineItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        paddingBottom: 10,
        flex: 1,
    },
    lineName: {
        fontWeight: '500',
        fontSize: 20
    },
    activeItem: {
        transform: [{rotate: '180deg'}]
    },
    inactiveItem: {
        transform: [{rotate: '0deg'}]
    },
    station: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 5
    },
    stationIcon: {
        borderRadius: 15,
        padding: 10,
        minWidth: 40,
        minHeight: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    stationIconText: {
        color: 'white',
        fontWeight: '500'
    }
});

export default DefaultStopLineItem;