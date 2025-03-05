// firebase function backend to send push notification to user

// cloud functions sdk
const { logger } = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

// firebase admin sdk for firestore
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// firebase cloud messaging
const { getMessaging } = require("firebase-admin/messaging");

// get train api key for local testing
require("dotenv").config();
const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI";
const TRAIN_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

initializeApp();

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

// function to retrieve next departure from api
async function getNextService(stopCode, userLine) {
    try {
        console.log(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${TRAIN_API_KEY}`);
        const response = await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${TRAIN_API_KEY}`);
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
        return [];
    }
}

exports.fireNotifications = onRequest(async (req, res) => {
    try {
        const db = getFirestore();
        const messaging = getMessaging();

        // get all of the notifications that are active
        const snapshot = await db.collection("notifications")
            .where("isActive", "==", true)
            .get();

        if (snapshot.empty) {
            return res.json({ result: "No active notifications found"})
        }


        // NOTE TO SELF: forEach does not respect async functions.
        // getting notification data for each, and building the payload to send to correct token

        for (const doc of snapshot.docs) {
            const notification = doc.data();
            const userDoc = await notification.docRef.get();
            const fcmToken = userDoc.data().fcmToken;
            const nextService = await getNextService(notification.station, notification.line);
            console.log(nextService[0]);

            // format data from api response
            const body = `Heading towards ${nextService[0].DirectionName} departs at ${nextService[0].DisplayedDepartureTime} on ${nextService[0].DisplayedPlatform}.`;

            const message = {
                data: {
                    title: `Next ${nextService[0].LineName} Departure`,
                    body: body
                },
                token: fcmToken
            }

            getMessaging().send(message)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.log('Error sending message:', error);
                })
        }
        
        res.json({ result: 'completed sending notifications' });
    } catch (error) {
        res.json({result: `error occured while firing notifications: ${error}`})
    }
});