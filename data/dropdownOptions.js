import { getItem } from "../utils/AsyncStorage";

export const trainLineSelections = [
    {key: '1', value: 'Barrie'},
    {key: '2', value: 'Kitchener'},
    {key: '3', value: 'Lakeshore East'},
    {key: '4', value: 'Lakeshore West'},
    {key: '5', value: 'Milton'},
    {key: '6', value: 'Richmond Hill'},
    {key: '7', value: 'Stouffville'},
]

export let stopMap = new Map();

stopMap.set('Barrie', [
    {name: "Downsview Park GO", code: "DW"},
    {name: "Rutherford GO", code: "RU"},
    {name: "Maple GO", code: "MP"},
    {name: "King City GO", code: "KC"},
    {name: "Aurora GO", code: "AU"},
    {name: "Newmarket GO", code: "NE"},
    {name: "East Gwillimbury GO", code: "EA"},
    {name: "Bradford GO", code: "BD"},
    {name: "Barrie South GO", code: "BA"},
    {name: "Allandale Waterfront GO", code: "AD"},
]);

stopMap.set('Kitchener', [
    {name: "Bloor GO", code: "BL"},
    {name: "Weston GO", code: "WE"},
    {name: "Etobicoke North GO", code: "ET"},
    {name: "Malton GO", code: "MA"},
    {name: "Bramalea GO", code: "BE"},
    {name: "Brampton Innovation District GO", code: "BR"},
    {name: "Mount Pleasant GO", code: "MO"},
    {name: "Georgetown GO", code: "GE"},
    {name: "Acton GO", code: "AC"},
    {name: "Guelph Central GO", code: "GL"},
    {name: "Kitchener GO", code: "KI"},
]);

stopMap.set('Lakeshore East', [
    {name: "Danforth GO", code: "DA"},
    {name: "Scarborough GO", code: "SC"},
    {name: "Eglinton GO", code: "EG"},
    {name: "Guildwood GO", code: "GU"},
    {name: "Rouge Hill GO", code: "RO"},
    {name: "Pickering GO", code: "PIN"},
    {name: "Ajax GO", code: "AJ"},
    {name: "Whitby GO", code: "WH"},
    {name: "Durham College Oshawa GO", code: "OS"},
]);

stopMap.set('Lakeshore West', [
    {name: "Exhibition GO", code: "EX"},
    {name: "Mimico GO", code: "MI"},
    {name: "Long Branch GO", code: "LO"},
    {name: "Port Credit GO", code: "PO"},
    {name: "Clarkson GO", code: "CL"},
    {name: "Oakville GO", code: "OA"},
    {name: "Bronte GO", code: "BO"},
    {name: "Appleby GO", code: "AP"},
    {name: "Burlington GO", code: "BU"},
    {name: "Aldershot GO", code: "AL"},
    {name: "Hamilton GO Centre", code: "HA"},
    {name: "West Harbour GO", code: "WR"},
    {name: "St. Catharines GO (VIA Station)", code: "SCTH"},
    {name: "Niagara Falls GO (VIA Station)", code: "NI"},
]);

stopMap.set('Milton', [
    {name: "Kipling GO", code: "KP"},
    {name: "Dixie GO", code: "DI"},
    {name: "Cooksville GO", code: "CO"},
    {name: "Erindale GO", code: "ER"},
    {name: "Streetsville GO", code: "SR"},
    {name: "Meadowvale GO", code: "ME"},
    {name: "Lisgar GO", code: "LS"},
    {name: "Milton GO", code: "ML"},
]);

stopMap.set('Richmond Hill', [
    {name: "Oriole GO", code: "OR"},
    {name: "Old Cummer GO", code: "OL"},
    {name: "Langstaff GO", code: "LA"},
    {name: "Richmond Hill GO", code: "RI"},
    {name: "Gormley GO", code: "GO"},
    {name: "Bloomington GO", code: "BM"},
]);

stopMap.set('Stouffville', [
    {name: "Danforth GO", code: "DA"},
    {name: "Scarborough GO", code: "SC"},
    {name: "Kennedy GO", code: "KE"},
    {name: "Agincourt GO", code: "AG"},
    {name: "Milliken GO", code: "MK"},
    {name: "Unionville GO", code: "UI"},
    {name: "Centennial GO", code: "CE"},
    {name: "Markham GO", code: "MR"},
    {name: "Mount Joy GO", code: "MJ"},
    {name: "Stouffville GO", code: "ST"},
    {name: "Old Elm GO", code: "LI"},
]);

export const getStops = async () => {
    try {
        const data = await getItem('line');
        let stops = stopMap.get(data);
        stops = stops.map((info, index) => ({ key: index + 1, value: info.name })); // convert to object needed with SelectList
        return stops;
    } catch (error) {
        console.log(error);
        return [];
    }
};

export const getStopsWithLine = async (line) => {
    try {
        let stops = stopMap.get(line);
        stops = stops.map((info, index) => ({ key: index + 1, value: info.name })); // convert to object needed with SelectList
        return stops;
    } catch (error) {
        console.log(error);
        return [];
    }
}

// get the correct stop from dropdownOptions based on user selected line and stop
export const getStopCode = async () => {
    try {
        const line = await getItem('line');
        const stop = await getItem('stop');
        const code = stopMap.get(line).filter((station) => station.name === stop);
        return code[0]['code']; // find stop code by searching stops by line, filter by station name, first result is code.
    } catch (error) {
        console.log(error);
        return "";
    }
}