import { User, UpdateUser, CartItem, UserProfile } from "./types";
import { EmailVerificator } from "./types";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
const db = admin.firestore();

export default class Users {
    private static usersRef = db.collection("Users");

    /**
     * retrieves a user with the email address provided, or null if doesn't exist
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
     * creates a user with the email and password provided, if email doesn't already exist
     */
    public static async createUser(user: User) {
        const docRef = await this.usersRef.doc(user.email).get();
        const doesUserExist: boolean = docRef.exists;
        if (doesUserExist) throw Error("Email address already in use!");

        await this.usersRef.doc(user.email).set(user);
    }

    /**
     * verifies that the user's email and password are valid
     */
    public static async authUser(
        email: string,
        password: string
    ): Promise<User> {
        // fetch user with email
        const user = await this.getUser(email, true);
        if (user == null) throw Error("Incorrect email or password!");

        // @ts-ignore
        // verify the password of the user
        if (!(await bcrypt.compare(password, user.password)))
            throw Error("Incorrect email or password!");

        return user;
    }

    /**
     * handle setting user's isEmailVerifiedFlag to true
     */
    public static async updateVerification(emailVer: EmailVerificator) {
        const email = emailVer.email;
        const docRef = this.usersRef.doc(email);
        const user = await docRef.get();

        if (!user.exists) throw Error("Email cannot be found");
        await docRef.update({ isEmailVerified: true });
    }

    public static async updateUser(
        email: string,
        updatedObject: UpdateUser
    ): Promise<User> {
        const docRef = this.usersRef.doc(email);
        const prevUser = await docRef.get();
        await docRef.update(updatedObject);

        // Object.assign({}, prevUser.data(), updatedObject);
        const updatedProfile: User = {
            ...(<User>prevUser.data()),
            ...updatedObject,
        };
        delete (updatedProfile as any).password;
        return updatedProfile;
    }

    public static async addItem(itemId: string, email: string) {
        const docRef = this.usersRef.doc(email);
        await docRef.update({
            itemsList: admin.firestore.FieldValue.arrayUnion(itemId),
        });
    }

    public static async removeItem(itemId: string, email: string) {
        const docRef = this.usersRef.doc(email);
        await docRef.update({
            itemsList: admin.firestore.FieldValue.arrayRemove(itemId),
        });
    }

    public static async getProfile(email: string): Promise<UserProfile> {
        const { bio, profilePic, itemsList }: UserProfile = await this.getUser(
            email
        );

        return { bio, email, profilePic, itemsList };
    }

    public static async updateCart(
        email: string,
        cartItem: CartItem
    ): Promise<User> {
        const user: User = await this.getUser(email);
        const idx = user.cart.findIndex(
            (element) => element.itemId === cartItem.itemId
        );

        if (idx >= 0 && cartItem.quantity > 0) {
            user.cart[idx].quantity = cartItem.quantity;
        } else if (idx >= 0 && cartItem.quantity === 0) {
            user.cart.splice(idx, 1);
        } else {
            user.cart.push(cartItem);
        }

        return await this.updateUser(email, { cart: user.cart });
    }
}
