import express from "express";
import Users from "./../models/Users";
import { CartItem, UpdateUser } from "./../models/types";
import EmailVerification from "./../models/EmailVerification";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { verifyJwtToken } from "./../middleware";
import bcrypt from "bcrypt";
import { app } from "firebase-admin";

const SECRET_KEY: string = process.env.SECRET_KEY as string;
const SALT_ROUNDS = 10;

/**
 * @desc Router module to handle requests to '/user/...'
 */
const router = express.Router();

/**
 * @desc Based on the User object from req.body, create a new unique User in the database
 */

// validates email and password format
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

            // create  a unique user with default fields
            await Users.createUser({
                email,
                password: await bcrypt.hash(password, SALT_ROUNDS),
                isEmailVerified: false,
                bio: "",
                profilePic: "",
                itemsList: [],
                cart: [],
            });

            // send verification email
            await EmailVerification.sendVerificationEmail(email);

            res.json({});
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

/**
 * @desc Endpoint sent to the user's  email for verification
 * Will be used to verify McGill emails
 */
router.get("/verify/:uid", async (req, res) => {
    try {
        // Verify user email
        const email: string = await EmailVerification.verifyEmail(
            req.params.uid
        );
        // Update user's email verification flag
        await Users.updateVerification(email);

        // Redirect to main page
        res.redirect("/");
    } catch (err) {
        res.json({ error: true, message: err.message || err.toString() });
    }
});

/**
 * @desc Authenticate user based on email and password
 * @returns If authentication successful, returns a jwt token cookie to the user
 */
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

            // Authenticate user
            const user = await Users.authUser(email, password);

            // After authenticating the user, create web token
            const token = jwt.sign(
                { email, isEmailVerified: user.isEmailVerified },
                SECRET_KEY
            );

            // Push cookie to user
            res.cookie("token", token, { httpOnly: true });

            res.json(user);
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

/**
 * @desc Middleware to verify jwt
 * After this point all requests must be authenticated
 * */
router.use(verifyJwtToken);

/**
 * @desc Update user's profile
 */
router.post(
    "/update",
    body("bio").isString().optional(),
    body("profilePic").isURL().optional(),
    async (req: express.Request, res) => {
        try {
            // validate request body
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            // Extract optional fields from body
            const updatedFields: UpdateUser = ["bio", "profilePic"].reduce(
                (acc, cur) => {
                    if (req.body[cur]) acc[cur] = req.body[cur];
                    return acc;
                },
                {} as any
            );
            // If none of the optional fields provided, throw an error
            if (Object.keys(updatedFields).length === 0)
                return res.json({
                    error: true,
                    message: "Must provide either a bio or a profile picture!",
                });

            // Update user
            const user = await Users.updateUser(
                <string>req.email,
                updatedFields
            );
            // Return updated user
            res.json(user);
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

/**
 * @desc Fetch a user's (specified by email) profile
 */
router.get("/profile/:email", async (req: express.Request, res) => {
    try {
        const profile = await Users.getProfile(req.params.email);
        res.json(profile);
    } catch (err) {
        res.json({ error: true, message: err.message || err.toString() });
    }
});

/**
 * @desc Update user's cart (add  certain quantity of an item or remove an item)
 * @returns {User} updated user
 */
router.post(
    "/updateCart",
    body("itemId").notEmpty(),
    body("quantity").isInt({ min: 0 }).toFloat(),
    async (req: express.Request, res) => {
        try {
            // validate request body
            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            // Extract item specifications
            const { itemId, quantity } = req.body;

            // update user's cart
            const user = await Users.updateCart(
                <string>req.email,
                <CartItem>{ itemId, quantity }
            );
            // return updated user
            res.json(user);
        } catch (err) {
            res.json({ error: true, message: err.message || err.toString() });
        }
    }
);

export default router;
