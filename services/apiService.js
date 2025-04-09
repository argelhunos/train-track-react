import { getStopCode } from "../data/dropdownOptions";
import { fullStationName, lineAbbreviation } from "../data/titleAttributes";
import { getItem } from "../utils/AsyncStorage";
import Constants from 'expo-constants';

const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI"
const KEY = Constants.expoConfig.extra.apiKey;

function lineTimeCompare(lineA, lineB) {
    // must convert everything to minutes since midnight for proper handling of past midnight
    const [lineAHours, lineAMins] = lineA.DisplayedDepartureTime.split(":");
    const [lineBHours, lineBMins] = lineB.DisplayedDepartureTime.split(":");

    let lineAMinsSinceMidnight = parseInt(lineAHours) * 60 + parseInt(lineAMins);
    let lineBMinsSinceMidnight = parseInt(lineBHours) * 60 + parseInt(lineBMins);

    // consider times 00:00-03:00 to be greater
    if (lineAHours === "00" || lineAHours == "01" || lineAHours == "02" || lineAHours == "03" ) {
        lineAMinsSinceMidnight += 24 * 60;
    }

    if (lineBHours === "00" || lineBHours == "01" || lineBHours == "02" || lineBHours == "03" ) {
        lineBMinsSinceMidnight += 24 * 60;
    }

    if (lineAMinsSinceMidnight > lineBMinsSinceMidnight) {
        return 1;
    } else if (lineAMinsSinceMidnight < lineBMinsSinceMidnight) {
        return -1;
    } else {
        return 0;
    }
}

function padNumber(num) {
    if (num.toString().length === 1) {
        return "0" + num;
    } else {
        return num;
    }
}

function getDate() {
    // get todays date to request stops for the correct day
    const date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth() + 1; // +1 since 0 indexed
    let day = date.getDate();

    // fix padding if is single digit day
    day = padNumber(day);

    // fix padding if is single digit month
    month = padNumber(month);

    return `${year}${month}${day}`;
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

        
    } else if (trackNumber.length === 2) {
        // remove 0 at start
        return trackNumber.substring(1);
    } else {
        return "?";
    }
}   

// retrieve all departures for the user selected GO station and train line
export async function getNextService() {
    try {
        const stopCode = await getStopCode();
        const userLine = await getItem('line');
        const response = await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${KEY}`);
        let data = await response.json();

        // Check if "Lines" is null or undefined
        if (!data["NextService"] || !data["NextService"]["Lines"]) {
            return [];
        }

        // if "Lines" is null, there are no departures found.
        return data["NextService"]["Lines"]
            .filter((line) => line.LineName === userLine)
            .map(line => {
                const newScheduledDepartureTime = line.ScheduledDepartureTime.split(' ')[1].substring(0, 5);
                const newComputedDepartureTime = line.ComputedDepartureTime.split(' ')[1].substring(0, 5);

                return {
                    ...line, // copy all old assets
                    DisplayedDepartureTime: newComputedDepartureTime > newScheduledDepartureTime ? newComputedDepartureTime : newScheduledDepartureTime,
                    DirectionName: line.DirectionName.substring(5),
                    Delayed: newComputedDepartureTime > newScheduledDepartureTime,
                    DisplayedPlatform: line.ActualPlatform === "" ? `Platform ${line.ScheduledPlatform}` : `Platform ${line.ActualPlatform}`,
                }
            }
        ).sort(lineTimeCompare); // sort departures by time  
    } catch (error) {
        console.error(error);
        throw new Error(`${error}`);
    }
}

// NOTE: should not be trusted for track numbers at union. will sometimes only display one track when there is two
// retrieve all stops for a given trip number
export async function getSchedule(tripNumber) {
    try {
        const currentDate = getDate();
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
                    hasVisited: false,
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
                hasVisited: false, // default false, can change when calling getRemainingStops (idk is this is good visit this back)
            }
        });
    } catch (error) {
        throw new Error("An error has occurred: " + error);
    }
}

// retrieve remaining stops for a given trip
export async function getRemainingStops(tripNumber) {
    try {
        const response = await fetch(`${BASE_URL}/api/V1/Gtfs/Feed/TripUpdates?key=${KEY}`);
        const data = await response.json();

        // build tripID (format: yyyymmdd-lineCode-tripNumber)
        const currentDate = getDate();
        const lineName = await getItem('line');
        let lineCode = lineAbbreviation.get(lineName);

        // compensate for Kitchener internal code still being GT (Kitchener line prev. named Georgetown line)
        if (lineCode === "KI") {
            lineCode = "GT";
        }

        const tripId = `${currentDate}-${lineCode}-${tripNumber}`;
        
        console.log(tripId);
        console.log(data["entity"]);
        console.log(data["entity"].filter((trip) => trip.id === tripId));

        return data["entity"].filter((trip) => trip.id === tripId)[0]["trip_update"]["stop_time_update"];
    } catch (error) {
        console.error("An error has occurred: " + error);
        return null;
    }
}

// combine results from getSchedule and getRemainingStops
export async function getMergedTripDetails(tripNumber) {
    try {
        const schedule = await getSchedule(tripNumber);
        const remainingStops = await getRemainingStops(tripNumber);

        if (remainingStops === null) {
            return schedule;
        } else {
            return schedule.map((scheduledStop) => (
                {
                    ...scheduledStop,
                    hasVisited: !remainingStops.some((remainingStop) => remainingStop.stop_id === scheduledStop.Code),
                    
                }
            ));
        }

    } catch (error) {
        console.error("An error has occurred getmerged: " + error);
    }
}

// combine results from getSchedule and getRemainingStops for Union
// basically same as getMergedTripDetails but to compensate for Union station platforms being inaccurate with getSchedule
// to only be used on UnionDepartureBoard
export async function getMergedUnionTripDetails(tripNumber) {
    try {
        const mergedTripDetails = await getMergedTripDetails(tripNumber);
        const unionDepartures = await getUnionDepartures();

        // get union station platform
        const unionDepartureInfo = unionDepartures.find((departure) => departure.TripNumber === tripNumber)
        const unionTrackInfo = unionDepartureInfo.Info;

        return mergedTripDetails.map((stop) => {
            if (stop.Code === "UN") {
                return { ...stop, Track: {
                    Scheduled: unionTrackInfo
                } }
            } else {
                return { ...stop }
            }
        })
    } catch (error) {
        throw new Error("An error has occured: " + error);
    }
}

// get info about a given trip, including:
// coach count, if in motion, current location etc.
// will return null if information is unknown.
// PRIMARILY USED FOR COACH COUNT
export async function getCurrentTripInfo(tripNumber) {
    try {
        const response = await fetch(`${BASE_URL}/api/V1/ServiceataGlance/Trains/All?key=${KEY}`)
        let data = await response.json();

        return data["Trips"]["Trip"].filter((trip) => trip.TripNumber === tripNumber)[0];
    } catch (error) {
        throw new Error("An error has occurred: " + error);
    }
}

// retrieve all union departures, replicating departure board found at union
export async function getUnionDepartures() {
    try {
        const response = await fetch(`${BASE_URL}/api/V1/ServiceUpdate/UnionDepartures/All?key=${KEY}`);
        let data = await response.json();

        return data["AllDepartures"]["Trip"].map((trip) => (
            {
                ...trip,
                DisplayedDepartureTime: trip.Time.split(" ")[1].substring(0, 5),
                Stops: trip.Stops.map(info => info.Name),
                Platform: trip.Info.includes("Wait") ? "Wait / Attendez" : "Platform " + trip.Platform,
            }
        )).sort(lineTimeCompare)
    } catch (error) {
        throw new Error("An error has occured: " + error);
    }
}

export async function getUnionStationPlatform(tripNumber) {
    try {
        const response = await fetch(`${BASE_URL}/api/V1/ServiceUpdate/UnionDepartures/All?key=${KEY}`);
        let data = await response.json();

        return data["AllDepartures"]["Trip"].find((trip) => trip.TripNumber === tripNumber).Info;
    } catch (error) {
        throw new Error("An error has occured: " + error);
    }
}