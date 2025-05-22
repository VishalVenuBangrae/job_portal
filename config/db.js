import mongoose from "mongoose";
import dotenv from 'dotenv'
import colors from "colors";

const connectDB =  async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Connected to MongoDB Database ${mongoose.connection.host}`.bgMagenta.white);
    }
    catch (error){
    console.log(`mongodb error ${error}`.bgWhite);
    }
}

export default connectDB;