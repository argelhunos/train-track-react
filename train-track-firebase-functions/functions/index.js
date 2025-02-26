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
const TRAIN_API_KEY = process.env.EXPO_PUBLIC_API_KEY;

initializeApp();

//

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

        // getting notification data for each, and building the payload to send to correct token
        snapshot.forEach(async (doc) => {
            const notification = doc.data();
            const docRef = await notification.docRef.get();
            const fcmToken = await docRef.get();

            const message = {

            }
        });
        
        res.json({ result });
    } catch (error) {
        res.json({result: `error occured while firing notifications: ${error}`})
    }
});