import dotenv from 'dotenv';
import connectDB from "./db/index.js";
import express from "express";

const app=express();
console.log(app);

dotenv.config({
    path:'./env' 
});
connectDB();