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



// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser"; // Correctly imported
// import bodyParser from "body-parser";

// const app = express();

// // Middleware
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
// }));

// app.use(express.json({
//     limit: "15kb",
// }));

// // Correct usage of body-parser
// app.use(bodyParser.urlencoded({ extended: true }));

// // Serving static files
// app.use(express.static("public"));

// // Correct usage of cookie-parser
// app.use(cookieParser());

// // Routes
// import userRouters from './routes/userRoutes.js';
// app.use("/api/v1/users", userRouters);

// // http://localhost:8000/api/v1/users/register

// export { app };
