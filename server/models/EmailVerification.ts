import { User } from "./types";
import { EmailVerificator } from "./types";
import sgMail from "@sendgrid/mail";
import { uuid } from "uuidv4";
import admin from "firebase-admin";

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);
const db = admin.firestore();

export default class EmailVerification {
    private static verificationRef = db.collection("UserEmailVerification");

    public static async sendVerificationEmail(email: string) {
        const uid = uuid();
        sgMail.send({
            to: email,
            from: "akkusarya@gmail.com",
            subject: "ShopArt – Please verify your email!",
            templateId: "d-8d0dc6770cf84d31a7b8768242ed73b7",
            dynamicTemplateData: {
                link: `http://localhost:${process.env.PORT}/user/verify/${uid}`,
            },
        });
        this.verificationRef.doc(uid).set({ email });
    }

    public static async verifyEmail(uid: string) {
        const docRef = await this.verificationRef.doc(uid).get();
        if (docRef.exists) {
            return <EmailVerificator>docRef.data();
        } else {
            throw Error("This verification UUID cannot be found!");
        }
    }
}
