import express from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY: string = process.env.SECRET_KEY as string;

export function logRequest(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    console.info(`${req.method} ${req.originalUrl}`);
    next();
}

/**
 * @desc Middleware to verify jwt
 * */
export function verifyJwtToken(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    try {
        // verify that the token has been signed by us.
        const decoded = jwt.verify(req.cookies["token"], SECRET_KEY) as any;

        // attach email and verified boolean flag associated with token to request object for use in subsequent functions
        req.email = decoded.email;
        req.isEmailVerified = decoded.isEmailVerified ?? false;

        next();
    } catch (err) {
        res.json({ error: true, message: err.message || err.toString() });
    }
}
