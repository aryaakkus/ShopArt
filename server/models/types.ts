export interface User {
    email: string;
    isEmailVerified: boolean;
    bio: string;
    profilePic: string;
    itemsList: Array<string>;
    cart: Array<CartItem>;
    password?: string;
}

export interface UpdateUser {
    bio?: string;
    profilePic?: string;
    cart?: Array<CartItem>;
}
export interface UserProfile {
    email: string;
    bio: string;
    profilePic: string;
    itemsList: Array<string>;
}
export interface CartItem {
    itemId: string;
    quantity: number;
}

export interface Item {
    artistEmail: string;
    itemName: string;
    description: string;
    price: number;
    quantity: number;
    itemPic: string;
}
export interface UpdateItem {
    itemName?: string;
    description?: string;
    price?: number;
    quantity?: number;
    itemPic?: string;
}

declare global {
    namespace Express {
        export interface Request {
            email?: string;
            isEmailVerified?: boolean;
        }
    }
}
