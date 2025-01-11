import express from "express";
import cors from 'cors';
import cookieParser  from "cookie-parser";
import bodyParser from "body-parser";

const app=express();
app.use(cors(
    {
        origin:process.env.CORS_ORIGIN

    }
));
app.use(express.json({
    limit:"15kb"
}))
app.use(express.urlencoded())
app.use(express.static("public"))
app.use(cookieParser())


import userRouters from './routes/userRoutes.js'

app.use("/api/v1/users",userRouters)

// http://localhost:8000/api/users/register

export {app}


