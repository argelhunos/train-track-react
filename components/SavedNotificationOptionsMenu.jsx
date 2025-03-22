import { StyleSheet, TouchableNativeFeedback, View, Text } from "react-native";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

function SavedNotificationOptionsMenu({notification, deleteMethod}) {
    const { time, line, id, stop } = notification;
    const navigation = useNavigation();

    return (
        <View style={styles.expandedOptionsList}>
            <TouchableNativeFeedback
                onPress={() => 
                    navigation
                        .navigate('Notifications Modal', 
                            {
                                editMode: true,
                                line: line,
                                stop: stop,
                                time: time,
                                id: id
                            }
                        )
                }
            >
                <View style={styles.expandedOptions}>
                    <MaterialIcons name="edit" size={24} color="black" />
                    <Text>Edit Notification</Text>
                </View>
            </TouchableNativeFeedback>
            <TouchableNativeFeedback
                onPress={() => deleteMethod(id)}
            >
                <View style={styles.expandedOptions}>
                    <MaterialIcons name="delete" size={24} color="black" />
                    <Text>Delete</Text>
                </View>
            </TouchableNativeFeedback>
        </View>
    )
}

const styles = StyleSheet.create({
    expandedOptionsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12
    },
    expandedOptions: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    }
});

export default SavedNotificationOptionsMenu;