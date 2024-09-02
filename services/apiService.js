import { getStopCode } from "../data/dropdownOptions";
import { getItem } from "../utils/AsyncStorage";

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI"
const KEY = process.env.EXPO_PUBLIC_API_KEY

async function getNextService() {
    try {
        const stopCode = await getStopCode();
        const response = await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${KEY}`);
        const data = await response.json();
        return data["NextService"]["Lines"].map(line => ({
            ...line, // copy all old assets
            ScheduledDepartureTime: line.ScheduledDepartureTime.split(' ')[1].substring(0, 5), // remove seconds
            DirectionName: line.DirectionName.substring(5), // 
        }));  
    } catch (error) {
        throw new Error("An error has occurred: " + error);
    }
}
export default getNextService