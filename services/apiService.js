import { getStopCode } from "../data/dropdownOptions";
import { fullStationName } from "../data/titleAttributes";

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI"
const KEY = process.env.EXPO_PUBLIC_API_KEY

function lineTimeCompare(lineA, lineB) {
    if (lineA.ScheduledDepartureTime > lineB.ScheduledDepartureTime) {
        return 1;
    } else if (lineA.ScheduledDepartureTime < lineB.ScheduledDepartureTime) {
        return -1;
    } else {
        return 0;
    }
}

export async function getNextService() {
    try {
        const stopCode = await getStopCode();
        const response = await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${KEY}`);
        const data = await response.json();
        return data["NextService"]["Lines"].map(line => ({
            ...line, // copy all old assets
            ScheduledDepartureTime: line.ScheduledDepartureTime.split(' ')[1].substring(0, 5), // remove seconds
            DirectionName: line.DirectionName.substring(5), // 
        })).sort(lineTimeCompare); // sort departures by time  
    } catch (error) {
        throw new Error("An error has occurred: " + error);
    }
}

// TODO: refactor this is huge.
export async function getSchedule(tripNumber) {
    try {
        // get todays date to request stops for the correct day
        const date = new Date();

        let year = date.getFullYear();
        let month = date.getMonth() + 1; // +1 since 0 indexed
        let day = date.getDate();

        // fix padding if is single digit day
        if (day.toString.length === 1) {
            day = "0" + day;
        }

        // fix padding if is single digit month
        if (month.toString.length === 1) {
            month = "0" + month;
        }

        let currentDate = `${year}${month}${day}`
        const response = await fetch(`${BASE_URL}/api/V1/Schedule/Trip/${currentDate}/${tripNumber}?key=${KEY}`)
        let data = await response.json();

        // clean up track number for results from union station (ex. Track 0405 -> Track 4 & 5)
        data["Trips"][0]["Stops"].forEach((stop, index, array) => {
            if (stop.Code === "UN") {
                // check for results like 0405 for Scheduled
                if (stop.Track.Scheduled.length === 4) {
                    let platforms = [stop.Track.Scheduled.substring(0, 2), stop.Track.Scheduled.substring(2)];
                    platforms.forEach((platform, index, array) => {
                        if (platform.charAt(0) === "0") {
                            array[index] = platform.slice(1);
                        }
                    })
                    
                    platforms.sort();
                    
                    // change result like 0405 to 4 & 5
                    array[index].Track.Scheduled = platforms[0] + "/" + platforms[1];

                    
                } else if (stop.Track.Scheduled.length === 2) {
                    array[index].Track.Scheduled = array[index].Track.Scheduled.substring(1);
                }

                // check for results like 0405 for Actual.
                // HAVE TO CHECK FOR NULL DUE TO API RESULTS SOMETIMES BEING NULL
                if (stop.Track.Actual && stop.Track.Actual.length === 4) {
                    let platforms = [stop.Track.Actual.substring(0, 2), stop.Track.Actual.substring(2)];
                    platforms.forEach((platform, index, array) => {
                        if (platform.charAt(0) === "0") {
                            array[index] = platform.slice(1);
                        }
                    })

                    // change result like 0405 to 4 & 5
                    array[index].Track.Actual = platforms[0] + "&" + platforms[1];
                } else if (stop.Track.Actual && stop.Track.Actual.length === 2) {
                    array[index].Track.Actual = array[index].Track.Actual.substring(1);
                }
            }
        })

        return data["Trips"][0]["Stops"].map(stop => ({
            ...stop,
            Station: fullStationName.get(stop.Code),
            // note to self: have to create new nested obj since we're basically creating new obj literal
            Track: {
                ...stop.Track,
                // compensate for GO Transit API having empty fields >?>?>?>?>?>?>??????? 
                Scheduled: stop.Track.Scheduled === "" ? "?" : stop.Track.Scheduled,
                Actual: stop.Track.Scheduled === "" ? "?" : stop.Track.Actual,
            },
        }));
    } catch (error) {
        throw new Error("An error has occured: " + error);
    }
}