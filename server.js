// imports packages
import express from 'express';
import dotenv from 'dotenv';
import colors from 'colors';
import cors from "cors";
import morgan from "morgan";
import path from 'path';
import { fileURLToPath } from 'url';

//import files
import testRoutes from './routes/testRoutes.js';
import authRoutes from './routes/authRoutes.js';
import connectDB from './config/db.js';
import jobRoutes from './routes/jobRoutes.js';
  


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

// Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

//routes
app.use('/api/v1/test', testRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);



//port
const PORT = process.env.PORT || 8080;
 

//listen
app.listen(PORT, ()=> {
    console.log(`Node server in ${process.env.DEV_MODE} mode running on port ${PORT}`.bgCyan.white);
});
