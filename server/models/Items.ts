import { Item, UpdateItem } from "./types";
import Users from "./Users";
import admin from "firebase-admin";
import { uuid } from "uuidv4";
const db = admin.firestore();

export default class Items {
    private static itemsRef = db.collection("Items");

    /**
     *
     * @param item
     */
    public static async createItem(item: Item) {
        const itemId = (await this.itemsRef.add(item)).id;
        await Users.addItem(itemId, item.artistEmail);
    }

    public static async getItem(itemId: string): Promise<Item | null> {
        const item = await this.itemsRef.doc(itemId).get();
        return <Item>(item.exists ? item.data() : null);
    }

    public static async updateItem(
        itemId: string,
        updatedObject: UpdateItem,
        email: string
    ): Promise<Item> {
        const docRef = this.itemsRef.doc(itemId);
        const prevItem = await docRef.get();

        if (!prevItem.exists) throw Error("Item not found!");

        if ((<Item>prevItem.data()).artistEmail != email)
            throw Error("You are not allowed to update this item!");

        await docRef.update(updatedObject);

        return <Item>{ ...prevItem.data(), ...updatedObject };
    }

    public static async deleteItem(itemId: string, email: string) {
        const docRef = this.itemsRef.doc(itemId);
        const prevItem = await docRef.get();

        if (!prevItem.exists) throw Error("Item not found!");

        if ((<Item>prevItem.data()).artistEmail != email)
            throw Error("You are not allowed to update this item!");

        await Users.removeItem(itemId, email);
        await docRef.delete();
    }
}
