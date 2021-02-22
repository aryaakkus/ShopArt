import { User, UpdateUser, CartItem, UserProfile } from "./types";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
import Items from "./Items";
const db = admin.firestore();

export default class Users {
    private static usersRef = db.collection("Users");

    /**
     * @desc Fetch user data from database and return a {User}
     * @param email user email as database primary key
     * @param withPassword flag to return including user.password or not , default: false
     * @returns {User} user object with or without password field
     */
    public static async getUser(
        email: string,
        withPassword: boolean = false
    ): Promise<User> {
        const userRef = await this.usersRef.doc(email).get();
        if (userRef.exists) {
            const user = <User>{ ...userRef.data() };
            if (!withPassword) delete user.password;
            return user;
        }
        throw Error("User does not exist!");
    }

    /**
     * @desc Add a new user to user database
     * @param {User} user
     */
    public static async createUser(user: User) {
        const docRef = await this.usersRef.doc(user.email).get();
        // check if user exists
        const doesUserExist: boolean = docRef.exists;
        if (doesUserExist) throw Error("Email address already in use!");

        await this.usersRef.doc(user.email).set(user);
    }

    /**
     * @desc Authenticate user based on email and password
     * @param email user email
     * @param password user password (hashed)
     * @returns {Promise <User>} if authentication is successful, returns corresponding user from db.
     */
    public static async authUser(
        email: string,
        password: string
    ): Promise<User> {
        // fetch user with email
        const user = await this.getUser(email, true);
        if (user == null) throw Error("Incorrect email or password!");

        // verify the password of the user
        if (!(await bcrypt.compare(password, user.password as string)))
            throw Error("Incorrect email or password!");

        delete user.password;
        // If authentication successful, return user without password
        return user;
    }

    /**
     * @desc handle setting user's isEmailVerifiedFlag to true
     * @param {string} email contains verified email
     */
    public static async updateVerification(email: string) {
        const docRef = this.usersRef.doc(email);
        const user = await docRef.get();

        if (!user.exists) throw Error("Email cannot be found");
        await docRef.update({ isEmailVerified: true });
    }

    /**
     * @desc Update appropriate user fields in database
     * @param email User reference in db
     * @param updatedObject Object conatining updated fields
     * @returns {User} updated user
     */
    public static async updateUser(
        email: string,
        updatedObject: UpdateUser
    ): Promise<User> {
        // get user
        const prevUser = await this.getUser(email);
        // update fields
        await this.usersRef.doc(email).update(updatedObject);

        // merge objects here to minimize database calls
        const updatedUser: User = {
            ...prevUser,
            ...updatedObject,
        };

        return updatedUser;
    }

    /**
     * @desc Add new item to user's item list (portfolio)
     * @param itemId unique itemId as database key
     * @param email  as user's database key
     */
    public static async addItem(itemId: string, email: string) {
        //get user reference
        const docRef = this.usersRef.doc(email);
        // add itemId to user's item list
        await docRef.update({
            itemsList: admin.firestore.FieldValue.arrayUnion(itemId),
        });
    }
    /**
     * @desc Remove item from user's item list (portfolio)
     * @param itemId unique itemId as database key
     * @param email  as user's database key
     */
    public static async removeItem(itemId: string, email: string) {
        const docRef = this.usersRef.doc(email);
        await docRef.update({
            itemsList: admin.firestore.FieldValue.arrayRemove(itemId),
        });
    }
    /**
     * @desc return a specific {User} user's {UserProfile} profile
     * @param email as user's database key
     * @returns {Promise<UserProfile>} profile of specified user
     */
    public static async getProfile(email: string): Promise<UserProfile> {
        const { bio, profilePic, itemsList }: UserProfile = await this.getUser(
            email
        );

        return { bio, email, profilePic, itemsList };
    }
    /**
     * @desc Updates user's shopping cart
     * @param email as user's database key
     * @param cartItem new update to the cart
     * @returns {User} updated user
     */
    public static async updateCart(
        email: string,
        cartItem: CartItem
    ): Promise<User> {
        // check if item exists and in stock
        const item = await Items.getItem(cartItem.itemId);
        if (item === null) throw Error("Invalid item ID!");
        if (item.quantity < cartItem.quantity)
            throw Error("This item is not available for requested quantity");

        // fetch user data from db
        const user: User = await this.getUser(email);

        // find if the item is in user's cart and its index if it is
        const idx = user.cart.findIndex(
            (element) => element.itemId === cartItem.itemId
        );

        // if item exists and item is not being removed update item
        if (idx >= 0 && cartItem.quantity > 0) {
            user.cart[idx].quantity = cartItem.quantity;

            // remove item
        } else if (idx >= 0 && cartItem.quantity === 0) {
            user.cart.splice(idx, 1);
        } else {
            // if item is not present, add to cart
            user.cart.push(cartItem);
        }

        // update cart in db and return updated user
        return await this.updateUser(email, { cart: user.cart });
    }
}
