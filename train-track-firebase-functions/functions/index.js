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
async function createSchedulerJob(token, stopCode, schedule, line, towardsUnion) {
  console.log("attempting to create new scheduler job...");
  console.log(schedule);
  const job = {
    description: `scheduled job for: ${stopCode}, ${schedule}, ${line}, towardsUnion: ${towardsUnion}`,
    httpTarget: {
      uri: "https://firenotification-ro7m6aqmfa-uc.a.run.app",
      httpMethod: "POST",
      body: Buffer.from(JSON.stringify({token, stopCode, schedule, line, towardsUnion})).toString("base64"),
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

    const {token, stopCode, line, towardsUnion} = data;
    const apiKey = process.env.TRAIN_KEY;
    const nextService = await getNextService(stopCode, line, apiKey);

    // filter API results to first either towards union or away from union
    let nextDeparture;
    
    if (towardsUnion) {
      nextDeparture = nextService.find((departure) => departure.DirectionName.includes("Union Station"));
    } else {
      nextDeparture = nextService.find((departure) => !departure.DirectionName.includes("Union Station"));
    }

    // format data from api response
    let title = "";
    let body = "";

    if (nextDeparture == null) {
      title = ""
      body = `No upcoming departures found for your saved ${line} trip.`;
    } else {
      title = `Next ${nextDeparture.LineName} Departure`;
      body = `Heading towards ${nextDeparture.DirectionName} departs at ${nextDeparture.DisplayedDepartureTime} on ${nextDeparture.DisplayedPlatform}`;
    }

    console.log("body: " + body);
    const message = {
      data: {
        title: title,
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

exports.scheduleNotification = onRequest(
  {secrets: ["FUNCTION_KEY"]},
  async (req, res) => {
  const authKey = req.headers['x-api-key'];

  if (authKey !== process.env.FUNCTION_KEY) {
    return res.status(403).send("Forbidden");
  }

  const {givenUserDoc, stopCode, schedule, line, towardsUnion} = req.body;

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
      enabled: true,
      towardsUnion: towardsUnion,
    };

    let createdJob;
    let storedNotificationId;

    try {
      const newNotificationDocRef = await notificationCollectionRef.add(newNotif);
      console.log("Notification written with id: " + newNotificationDocRef.id);
      storedNotificationId = newNotificationDocRef.id;
      
      // schedule cloud job
      createdJob = await createSchedulerJob(fcmToken, stopCode, schedule, line, towardsUnion);

      // add cloud job name to firestore
      newNotificationDocRef.update({ schedulerName: createdJob });
    } catch (error) {
      throw new Error("Error adding notification to firestore: " + error);
    }

    // return status 200
    res.status(200).json(
      { 
        createdJob: createdJob,
        notificationId: storedNotificationId,
      }
    );
  } catch (error) {
    res.status(500).send("Scheduling notification failed: " + error);
  }
});

exports.deleteNotification = onRequest(
  {secrets: ["FUNCTION_KEY"]},
  async (req, res) => {
  const {cloudJobPath, firebaseDocumentId} = req.body;
  const authKey = req.headers['x-api-key'];

  if (authKey !== process.env.FUNCTION_KEY) {
    return res.status(403).send("Forbidden");
  }

  try {
    const request = {
      name: cloudJobPath,
    };

    // delete the scheduled job
    const response = await schedulerClient.deleteJob(request);

    // delete record from firebase
    const db = getFirestore();
    const notificationCollectionRef = db.collection("notifications");

    await notificationCollectionRef.doc(firebaseDocumentId).delete();

    res.status(200).send("successfully deleted notification");
  } catch (error) {
    res.status(500).send("deleting notification failed: " + error);
  }
});

exports.toggleNotification = onRequest(async (req, res) => {
  const {cloudJobPath, firebaseDocumentId} = req.body;

  const request = {
    name: cloudJobPath,
  };

  console.log("attempting to toggle notification...");

  try {
    // get notification status
    const db = getFirestore();
    const notificationCollectionRef = db.collection("notifications");
    const notificationDocRef = notificationCollectionRef.doc(firebaseDocumentId);
    const notificationDocument = await notificationDocRef.get();
    const notificationData = notificationDocument.data();

    if (!notificationData) {
      throw new Error("Notification not found.");
    }

    const currentStatus = notificationData.enabled;

    if (currentStatus === true) {
      // pause job
      const schedulerResponse = await schedulerClient.pauseJob(request);
    } else {
      // resume job
      const schedulerResponse = await schedulerClient.resumeJob(request);
    }

    // change status in firebase
    notificationDocRef.update(
      {
        enabled: !currentStatus,
      }
    );

    res.status(200).send("Successfully toggled notification to status: " + !currentStatus);
  } catch (error) {
    res.status(500).send("Error occurred toggling notification: " + error);
  }
});

exports.editNotification = onRequest(async (req, res) => {
  const {
    cloudJobPath, 
    firebaseDocumentId, 
    givenUserDoc,
    notification: {
      stopCode,
      schedule,
      line,
      towardsUnion,
      enabled,
    }
  } = req.body;

  try {
    // edit notification in firebase
    const db = getFirestore();
    
    // grab fcm token
    const docRef = db.doc(givenUserDoc);
    const userDoc = await docRef.get();
    const token = userDoc.data().fcmToken;

    const updatedNotification = { 
      line: line,
      stopCode: stopCode,
      schedule: schedule,
      enabled: enabled,
      towardsUnion: towardsUnion,
    };

    const notificationCollectionRef = db.collection("notifications");

    await notificationCollectionRef.doc(firebaseDocumentId).update(updatedNotification);

    // edit notification in cloud scheduler

    const newBody = {
      token: token,
      stopCode: stopCode,
      schedule: schedule,
      line: line,
      towardsUnion: towardsUnion,
    }

    const request = {
      job: {
        name: cloudJobPath,
        schedule: schedule,
        description: `scheduled job for: ${stopCode}, ${schedule}, ${line}, towardsUnion: ${towardsUnion}`,
        httpTarget: {
          body: Buffer.from(JSON.stringify(newBody)),
          uri: "https://firenotification-ro7m6aqmfa-uc.a.run.app",
          httpMethod: "POST"
        },
        timeZone: "America/Toronto",
      },
    }

    const [response] = await schedulerClient.updateJob(request);

    // attach cloud job name to firestore
    await notificationCollectionRef.doc(firebaseDocumentId).update({
      ...updatedNotification,
      schedulerName: response.name
    });

    res.status(200).send("Successfully edited notification.");
  } catch (error) {
    res.status(500).send("Error occurred editing notification: " + error);
  }
});