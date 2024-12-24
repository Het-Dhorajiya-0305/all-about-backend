import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


async function connectDB() {
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n mongoDb connected !! response : ${connectionInstance.connection.host}`)
    }
    catch(error)
    {
        console.log("mongodb connection error",error);
        process.exit(1);

    }
    
}

export default connectDB