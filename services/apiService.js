import { getStopCode } from "../data/dropdownOptions";
import { fullStationName } from "../data/titleAttributes";
import { getItem } from "../utils/AsyncStorage";

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI"
const KEY = process.env.EXPO_PUBLIC_API_KEY

// TODO: handle case of departure at midnight 00:00
function lineTimeCompare(lineA, lineB) {
    if (lineA.ScheduledDepartureTime > lineB.ScheduledDepartureTime) {
        return 1;
    } else if (lineA.ScheduledDepartureTime < lineB.ScheduledDepartureTime) {
        return -1;
    } else {
        return 0;
    }
}

function padNumber(num) {
    if (num.toString.length === 1) {
        return "0" + num;
    } else {
        return num;
    }
}

// clean up responses from trackNumbers like 0405 from union station
function cleanTrackNumber(trackNumber) {
    // prevent cleaning track number response if null
    if (!trackNumber) {
        return "?";
    }

    // check for results like 0405 for Scheduled
    if (trackNumber.length === 4) {
        let platforms = [trackNumber.substring(0, 2), trackNumber.substring(2)];

        // remove 0 at start
        platforms.forEach((platform, index, array) => {
            if (platform.charAt(0) === "0") {
                array[index] = platform.slice(1);
            }
        })
        
        // ensure results printed are sorted numerically
        platforms.sort((a, b) => Number(a) - Number(b));
        
        // change result like 0405 to 4 & 5
        console.log(platforms);
        return platforms[0] + "/" + platforms[1];

        
    } else if (stop.Track.Scheduled.length === 2) {
        // remove 0 at start
        return trackNumber.substring(1);
    } else {
        return "?";
    }
}   

export async function getNextService() {
    try {
        const stopCode = await getStopCode();
        const userLine = await getItem('line');
        const response = await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${KEY}`);
        let data = await response.json();

        return data["NextService"]["Lines"]
            .filter((line) => line.LineName === userLine)
            .map(line => ({
                ...line, // copy all old assets
                ScheduledDepartureTime: line.ScheduledDepartureTime.split(' ')[1].substring(0, 5), // remove seconds
                DirectionName: line.DirectionName.substring(5), // 
        })).sort(lineTimeCompare); // sort departures by time  
    } catch (error) {
        throw new Error("An error has occurred: " + error);
    }
}

export async function getSchedule(tripNumber) {
    try {
        // get todays date to request stops for the correct day
        const date = new Date();

        let year = date.getFullYear();
        let month = date.getMonth() + 1; // +1 since 0 indexed
        let day = date.getDate();

        // fix padding if is single digit day
        day = padNumber(day);

        // fix padding if is single digit month
        month = padNumber(month);

        let currentDate = `${year}${month}${day}`
        const response = await fetch(`${BASE_URL}/api/V1/Schedule/Trip/${currentDate}/${tripNumber}?key=${KEY}`)
        let data = await response.json();

        
        return data["Trips"][0]["Stops"].map((stop, index, array) => {
            // clean up track number for results from union station (ex. Track 0405 -> Track 4 & 5)
            if (stop.Code === "UN") {
                return {
                    ...stop,
                    Station: fullStationName.get(stop.Code),
                    Track: {
                        Scheduled: cleanTrackNumber(stop.Track.Scheduled),
                        Actual: cleanTrackNumber(stop.Track.Actual),
                    },
                    isFirstStop: !array[index-1] ? true : false,
                    isLastStop: !array[index+1] ? true : false,
                }
            }

            // clean up track number for results that api returns as blank
            return {
                ...stop,
                Station: fullStationName.get(stop.Code),
                // note to self: have to create new nested obj since we're basically creating new obj literal
                Track: {
                    ...stop.Track,
                    // compensate for GO Transit API having empty fields >?>?>?>?>?>?>??????? 
                    Scheduled: stop.Track.Scheduled === "" ? "?"
                            : !stop.Track.Scheduled ? "?"
                            : stop.Track.Scheduled,
                    Actual: stop.Track.Actual === "" ? "?"
                            : !stop.Track.Actual ? "?"
                            : stop.Track.Actual,
                },
                isFirstStop: !array[index-1] ? true : false,
                isLastStop: !array[index+1] ? true : false,
            }
        });
    } catch (error) {
        throw new Error("An error has occured: " + error);
    }
}