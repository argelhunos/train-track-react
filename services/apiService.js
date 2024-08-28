const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI"
const KEY = process.env.EXPO_PUBLIC_API_KEY

async function getNextService(stopCode = "mo") {
    try {
        const response = await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${KEY}`);
        const data = await response.json();
        return data["NextService"]["Lines"];  
    } catch (error) {
        throw new Error("An error has occurred: " + error);
    }
}
export default getNextService