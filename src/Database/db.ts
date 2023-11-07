const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

let isConnected = false;
console.log(dotenv.MONGODB_URL);

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if (!process.env.MONGODB_URL) return console.log('MongoDB URL not found');
    if (isConnected) return console.log('Already Connected to MongoDB');

    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected To MongoDB');
    } catch (error) {
        console.log(error);
    }
};
