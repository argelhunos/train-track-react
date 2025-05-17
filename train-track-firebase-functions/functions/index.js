/* eslint-disable */
// firebase function backend to send push notification to user

// firebase admin sdk for firestore
const {initializeApp} = require("firebase-admin/app");

// get train api key for local testing
require("dotenv").config();
const BASE_URL = "https://api.openmetrolinx.com/OpenDataAPI";

// interact with google cloud scheduler
const {CloudSchedulerClient} = require("@google-cloud/scheduler");

const schedulerClient = new CloudSchedulerClient();
const projectId = "train-track-d2ca0";
const locationId = "us-central1";

// full path to location where jobs are stored
const parent = `projects/${projectId}/locations/${locationId}`;

// firebase admin
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const {getMessaging} = require("firebase-admin/messaging");
const {onRequest} = require("firebase-functions/v2/https");


initializeApp();

function lineTimeCompare(lineA, lineB) {
  // must convert to minutes since midnight for proper handling of past midnight
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


async function getNextService(stopCode, userLine, apiKey) {
  try {
    const response = await fetch(`${BASE_URL}/api/V1/Stop/NextService/${stopCode}?key=${apiKey}`);
    const data = await response.json();

    // check if "Lines" is null or undefined
    if (!data["NextService"] || !data["NextService"]["Lines"]) {
      return [];
    }

    // if "Lines" is null, there is no departures found
    return data["NextService"]["Lines"]
        .filter((line) => line.LineName === userLine)
        .map((line) => {
          const newScheduledDepartureTime = line.ScheduledDepartureTime.split(" ")[1].substring(0, 5);
          const newComputedDepartureTime = line.ComputedDepartureTime.split(" ")[1].substring(0, 5);

          return {
            ...line, // copy all old assets
            DisplayedDepartureTime: newComputedDepartureTime > newScheduledDepartureTime ? newComputedDepartureTime : newScheduledDepartureTime,
            DirectionName: line.DirectionName.substring(5),
            Delayed: newComputedDepartureTime > newScheduledDepartureTime,
            DisplayedPlatform: line.ActualPlatform === "" ? `Platform ${line.ScheduledPlatform}` : `Platform ${line.ActualPlatform}`,
          };
        },
        ).sort(lineTimeCompare); // sort departures by time
  } catch (error) {
    console.error(error);
    return [];
  }
}

// ----- cloud scheduler operations
async function createSchedulerJob(token, stopCode, schedule, line) {
  console.log("attempting to create new scheduler job...");
  console.log(schedule);
  const job = {
    description: `scheudled job for: ${stopCode}, ${schedule}, ${line}`,
    httpTarget: {
      uri: "https://firenotification-ro7m6aqmfa-uc.a.run.app",
      httpMethod: "POST",
      body: Buffer.from(JSON.stringify({token, stopCode, schedule, line})).toString("base64"),
    },
    schedule: schedule,
    timeZone: "America/Toronto",
  };

  const request = {
    parent,
    job,
  };

  const [createdJob] = await schedulerClient.createJob(request);

  console.log("successfully created job:");
  console.log(`Name: ${createdJob.name}`);
  console.log(`Description: ${createdJob.description}`);
  console.log(`Schedule: ${createdJob.schedule}`);
  console.log(`Target URI: ${createdJob.httpTarget.uri}`);

  return createdJob.name;
}

// -----

exports.sendTestNotification = onRequest(async (req, res) => {
  const {token, title, body} = req.body;

  try {
    await admin.messaging().send({
      notification: {title, body},
      token,
    });
    res.status(200).send("Notification sent");
  } catch (err) {
    console.error("Error sending FCM", err);
    res.status(500).send("Notification failed");
  }
});

exports.fireNotification = onRequest(
  {secrets: ["TRAIN_KEY"]},
  async (req, res) => {
  try {
    let data;
    console.log("attempting to fire notification...");

    try {
      data = JSON.parse(Buffer.from(req.body, 'base64').toString());
    } catch (error) {
      data = req.body;
    }

    const {token, stopCode, line} = data;
    const apiKey = process.env.TRAIN_KEY;
    const nextService = await getNextService(stopCode, line, apiKey);

    // format data from api response
    const body = `Heading towards ${nextService[0].DirectionName} departs at ${nextService[0].DisplayedDepartureTime} on ${nextService[0].DisplayedPlatform}`;
    console.log("body: " + body);
    const message = {
      data: {
        title: `Next ${nextService[0].LineName} Departure`,
        body: body,
      },
      token: token,
    };

    // send message to user
    getMessaging().send(message)
        .then((response) => {
          console.log("Successfully sent message: ", response);
        })
        .catch((error) => {
          console.log("Error sending message: ", error);
        });

    res.json({result: "completed sending notification"});
  } catch (error) {
    res.json({result: `error occurred while firing notification: ${error}`});
  }
});

exports.scheduleNotification = onRequest(async (req, res) => {
  const {givenUserDoc, stopCode, schedule, line} = req.body;

  try {
    // grab fcmToken from firebase using provided userDoc
    const db = getFirestore();
    const docRef = db.doc(givenUserDoc);
    const userDoc = await docRef.get();
    const fcmToken = userDoc.data().fcmToken;

    // store notification into firebase
    const notificationCollectionRef = await db.collection("notifications");

    const newNotif = {
      line: line,
      stopCode: stopCode,
      schedule: schedule,
    };

    try {
      const newNotificationDocRef = await notificationCollectionRef.add(newNotif);
      console.log("Notification written with id: " + newNotificationDocRef.id);

      // schedule cloud job
      await createSchedulerJob(fcmToken, stopCode, schedule, line);
    } catch (error) {
      throw new Error("Error adding notification to firestore: " + error);
    }

    // return status 200
    res.status(200).send("Successfully scheduled notification");
  } catch (error) {
    res.status(500).send("Scheduling notification failed: " + error);
  }
});

exports.deleteNotification = onRequest(async (req, res) => {
  const {jobId} = req.body;

  try {
    const request = {
      name: jobId,
    };

    // delete the job
    const response = await schedulerClient.deleteJob(request);
    console.log(response);
    res.status(200).send("successfully deleted notification: " + jobId);
  } catch (error) {
    res.status(500).send("deleting notification failed: " + error);
  }
});
