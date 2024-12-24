import { View, Text, FlatList, StyleSheet } from "react-native";
import DefaultStopLineItem from "../components/DefaultStopLineItem";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DATA = [
    {
        id: "BR",
        title: "Barrie",
        data: ["Downsview Park GO", "Rutherford GO", "Maple GO", "King City GO", "Aurora GO", "Newmarket GO", "East Gwillimbury GO", "Bradford GO", "Barrie South GO", "Allandale Waterfront GO"]
    },
    {
        id: "KI",
        title: "Kitchener",
        data: ["Bloor GO", "Weston GO", "Etobicoke North GO", "Malton GO", "Bramalea GO", "Brampton Innovation District GO", "Mount Pleasant GO", "Georgetown GO", "Acton GO", "Guelph Central GO", "Kitchener GO"]
    },
    {
        id: "LE",
        title: "Lakeshore East",
        data: ["Danforth GO", "Scarborough GO", "Eglinton GO", "Guildwood GO", "Rouge Hill GO", "Pickering GO", "Ajax GO", "Whitby GO", "Durham College Oshawa GO"]
    },
    {
        id: "LW",
        title: "Lakeshore West",
        data: ["Exhibition GO", "Mimico GO", "Long Branch GO", "Port Credit GO", "Clarkson GO", "Oakville GO", "Bronte GO", "Appleby GO", "Burlington GO", "Aldershot GO", "Hamilton GO Centre", "West Harbour GO", "St. Catharines GO (VIA Station)", "Niagara Falls GO (VIA Station)"]
    },
    {
        id: "MI",
        title: "Milton",
        data: ["Kipling GO", "Dixie GO", "Cooksville GO", "Erindale GO", "Streetsville GO", "Meadowvale GO", "Lisgar GO", "Milton GO"]
    },
    {
        id: "RH",
        title: "Richmond Hill",
        data: ["Oriole GO", "Old Cummer GO", "Langstaff GO", "Richmond Hill GO", "Gormley GO", "Bloomington GO"]
    },
    {
        id: "ST",
        title: "Stouffville",
        data: ["Danforth GO", "Scarborough GO", "Kennedy GO", "Agincourt GO", "Milliken GO", "Unionville GO", "Centennial GO", "Markham GO", "Mount Joy GO", "Stouffville GO", "Old Elm GO"]
    }
]

function DefaultStopModal() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View
                style={{
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right
                }}
            >
                <FlatList 
                    data={DATA}
                    renderItem={({item}) => 
                        <DefaultStopLineItem lineName={item.title} stations={item.data.map(x => ({id: item.id + x, title: x}))}/>
                    }
                    keyExtractor={item => item.id}
                />
            </View>
        </View>

    )
}

const styles = StyleSheet.create({
    container: {
        padding: '5%'
    }
});

export default DefaultStopModal;