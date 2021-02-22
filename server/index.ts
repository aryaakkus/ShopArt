import express from "express";
import cookieParser from "cookie-parser";
import "./init";
import userRouter from "./routes/user";
import itemRouter from "./routes/item";
import { logRequest } from "./middleware";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cookieParser());
app.use(express.json());

// Log incoming requests for debugging
app.use(logRequest);

// Route handlers
app.use("/user", userRouter);
app.use("/item", itemRouter);

// home page route
app.get("/", (req, res) => {
    res.send("hello");
});

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
});
