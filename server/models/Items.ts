import { Item, UpdateItem } from "./types";
import Users from "./Users";
import admin from "firebase-admin";
import { uuid } from "uuidv4";
const db = admin.firestore();

export default class Items {
    private static itemsRef = db.collection("Items");

    /**
     * @desc Creates new item with unique item id as databese primary key
     * @param {Item} item object
     */
    public static async createItem(item: Item) {
        const itemId = (await this.itemsRef.add(item)).id;
        await Users.addItem(itemId, item.artistEmail);
    }

    /**
     * @desc Fetches an item from database using unique itemId
     * @param itemId as database primary key
     * @returns {Item} item if it exists, otherwise returns null
     */

    public static async getItem(itemId: string): Promise<Item | null> {
        const item = await this.itemsRef.doc(itemId).get();
        return item.exists ? <Item>item.data() : null;
    }
    /**
     * @desc Updates appropriate fields of an item specified by unique id (if user is authorized to do so)
     * @param itemId  as database primary key
     * @param updatedObject updated fields
     * @param email email address that requsted the update
     */
    public static async updateItem(
        itemId: string,
        updatedObject: UpdateItem,
        email: string
    ): Promise<Item> {
        // Get item referncee from db
        const docRef = this.itemsRef.doc(itemId);
        const prevItem = await docRef.get();

        // Check if item exists
        if (!prevItem.exists) throw Error("Item not found!");

        // check if user is authorized to update the item
        if ((<Item>prevItem.data()).artistEmail != email)
            throw Error("You are not allowed to update this item!");

        // At this point the user is authorized and item exist on db
        // Update item
        await docRef.update(updatedObject);

        // Return updated Item
        return <Item>{ ...prevItem.data(), ...updatedObject };
    }

    /**
     * @desc deletes an item specified with unique itemId (if user is authorized to do so)
     * @param itemId as database primary key
     * @param email email address that requsted the deletion
     */
    public static async deleteItem(itemId: string, email: string) {
        const docRef = this.itemsRef.doc(itemId);
        const prevItem = await docRef.get();

        // check if item exists
        if (!prevItem.exists) throw Error("Item not found!");

        // check if user is authorized to delete
        if ((<Item>prevItem.data()).artistEmail != email)
            throw Error("You are not allowed to delete this item!");

        // At this point the user is authorized and item exist on db
        // Delete item from item db and artist's items list
        await Users.removeItem(itemId, email);
        await docRef.delete();
    }
}
