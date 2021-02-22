import express from "express";
import validator from "validator";
import Users from "./../models/Users";
import { CartItem, EmailVerificator, UpdateUser } from "./../models/types";
import EmailVerification from "./../models/EmailVerification";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { verifyJwtToken } from "./../middleware";

import bcrypt from "bcrypt";

const SECRET_KEY: string = process.env.SECRET_KEY as string;
const SALT_ROUNDS = 10;

const router = express.Router();

router.post(
    "/create",
    body("email").isEmail(),
    body("password").isStrongPassword(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            // at this point we know the username & password is valid
            const { email, password } = req.body;

            await Users.createUser({
                email,
                password: await bcrypt.hash(password, SALT_ROUNDS),
                isEmailVerified: false,
                bio: "",
                profilePic: "",
                itemsList: [],
                cart: [],
            });

            await EmailVerification.sendVerificationEmail(email);

            res.json({});
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

router.get("/verify/:uid", async (req, res) => {
    try {
        const emailVer = await EmailVerification.verifyEmail(req.params.uid);
        await Users.updateVerification(<EmailVerificator>emailVer);
        res.json({ message: "success!" });
    } catch (err) {
        res.json({ error: true, message: err.message || err.toString() });
    }
});

router.post(
    "/login",
    body("email", "Incorrect email or password!").isEmail(),
    body("password", "Incorrect email or password!").notEmpty(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            const { email, password } = req.body;

            const user = await Users.authUser(email, password);

            // At this point we've authenticated the user.
            const token = jwt.sign(
                { email, isEmailVerified: user.isEmailVerified },
                SECRET_KEY
            );

            // Push cookie to user.
            res.cookie("token", token, { httpOnly: true });

            res.json(user);
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

// After this point all requests must be authenticated
router.use(verifyJwtToken);

router.post(
    "/update",
    body("bio").isString().optional(),
    body("profilePic").isURL().optional(),
    async (req: express.Request, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            const updatedFields: UpdateUser = ["bio", "profilePic"].reduce(
                (acc, cur) => {
                    acc[cur] = req.body[cur];
                    return acc;
                },
                {} as any
            );

            const user = await Users.updateUser(
                <string>req.email,
                updatedFields
            );
            res.json(user);
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

router.get("/profile/:email", async (req: express.Request, res) => {
    try {
        const profile = await Users.getProfile(req.params.email);
        res.json(profile);
    } catch (err) {
        res.json({ error: true, message: err.message || err.toString() });
    }
});

router.post(
    "/updateCart",
    body("itemId").notEmpty(),
    body("quantity").isInt({ min: 0 }).toFloat(),
    async (req: express.Request, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });
            const { itemId, quantity } = req.body;

            const user = await Users.updateCart(
                <string>req.email,
                <CartItem>{ itemId, quantity }
            );
            res.json(user);
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

export default router;
