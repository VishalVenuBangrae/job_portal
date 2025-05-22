// imports packages
import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import cors from "cors";
import morgan from "morgan";

//import files
import testRoutes from './routes/testRoutes.js';
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';
  


//dot env config
dotenv.config();

//mongodb connection
connectDB();


// rest object
const app = express();

//middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));


//routes
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);



//port
const PORT = process.env.PORT || 8080;
 

//listen
app.listen(PORT, ()=> {
    console.log(`Node server in ${process.env.DEV_MODE} mode running on port ${PORT}`.bgCyan.white);
});