import admin from "firebase-admin";
import sgMail from "@sendgrid/mail";

require("dotenv").config({
    path: "/Users/aryaakkus/Desktop/shopArt/server/.env",
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

// initialize firebase admin
const serviceAccount = require("./../servicekey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
