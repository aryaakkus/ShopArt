import express from "express";
import { Item, UpdateItem } from "../models/types";
import Items from "../models/Items";
import { body, validationResult } from "express-validator";
import { verifyJwtToken } from "./../middleware";

/**
 * @desc Router module to handle requests to '/item/...'
 */
const router = express.Router();

const ITEM_BODY: Array<string> = [
    "itemName",
    "description",
    "price",
    "quantity",
    "itemPic",
];

/**
 * @desc Middleware to verify jwt
 * After this point all requests must be authenticated
 * */
router.use(verifyJwtToken);

/**
 * @desc Creates a new unique item which belongs to current authenticated user
 */
router.post(
    "/create",
    body(["itemName", "description"], "expected type string").notEmpty(),
    body("price", "expected type float").isFloat().toFloat(),
    body("quantity", "expected type float").isInt().toFloat(),
    body("itemPic", "expected type url").isURL(),
    async (req, res) => {
        try {
            //validate and sanitze request body
            const errors = validationResult(req);

            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            // Create an Item object from fetched fields
            const item: Item = ITEM_BODY.reduce(
                (acc, cur) => {
                    acc[cur] = req.body[cur];
                    return acc;
                },
                { artistEmail: req.email ?? "" } as any
            );

            await Items.createItem(item);

            res.json({});
        } catch (err) {
            res.json({
                error: true,
                message: err.message || err.toString(),
            });
        }
    }
);
/**
 * @desc Deletes an item specified by unique itemID
 */
router.post("/delete/:itemId", async (req: express.Request, res) => {
    try {
        const itemId: string = req.params.itemId;
        await Items.deleteItem(itemId, <string>req.email);
        res.json({});
    } catch (err) {
        res.json({
            error: true,
            message: err.message || err.toString(),
        });
    }
});

/**
 * @desc Updates appropriate fields of an item specified by unique itemID
 * @returns Updated item
 */
router.post(
    "/update/:itemId",
    body("price").isFloat().optional().toFloat(),
    body("quantity").isInt().optional().toFloat(),
    body("itemPic").isURL().optional(),
    async (req: express.Request, res) => {
        try {
            // Validate request body
            const errors = validationResult(req);

            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            // Extract fields to be updated from request body
            const updatedFields: UpdateItem = ITEM_BODY.reduce((acc, cur) => {
                if (req.body[cur]) acc[cur] = req.body[cur];
                return acc;
            }, {} as any);

            // If none of the optional fields provided, throw an error
            if (Object.keys(updatedFields).length === 0)
                return res.json({
                    error: true,
                    message:
                        "Must provide either a price, quantity, description or an item picture!",
                });

            const itemId: string = req.params.itemId;

            // Update item
            const item: Item = await Items.updateItem(
                itemId,
                updatedFields,
                <string>req.email
            );

            // Return updated item
            res.json(item);
        } catch (err) {
            res.json({
                error: true,
                message: err.message || err.toString(),
            });
        }
    }
);

export default router;
