interface User {
    id?: string; // This is an internal property
    username: string;
    email: string;
    password: string;
}

export default User;