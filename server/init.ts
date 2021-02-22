import admin from "firebase-admin";

require("dotenv").config({
    path: "/Users/aryaakkus/Desktop/shopArt/server",
});

// initialize firebase admin
const serviceAccount = require("./../servicekey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
