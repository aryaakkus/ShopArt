import express from "express";
import { Item, UpdateItem } from "../models/types";
import Items from "../models/Items";
import { body, validationResult } from "express-validator";
import { verifyJwtToken } from "./../middleware";

const router = express.Router();

const ITEM_BODY: Array<string> = [
    "itemName",
    "description",
    "price",
    "quantity",
    "itemPic",
];

router.use(verifyJwtToken);

router.post(
    "/create",
    body(["itemName", "description"], "expected type string").notEmpty(),
    body("price", "expected type float").isFloat().toFloat(),
    body("quantity", "expected type float").isInt().toFloat(),
    body("itemPic", "expected type url").isURL(),
    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

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

router.post(
    "/update/:itemId",
    body("price").isFloat().optional().toFloat(),
    body("quantity").isInt().optional().toFloat(),
    body("itemPic").isURL().optional(),
    async (req: express.Request, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty())
                return res.json({ error: true, message: errors.array() });

            const updatedFields: UpdateItem = ITEM_BODY.reduce((acc, cur) => {
                acc[cur] = req.body[cur];
                return acc;
            }, {} as any);

            const itemId: string = req.params.itemId;

            const item: Item = await Items.updateItem(
                itemId,
                updatedFields,
                <string>req.email
            );

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
