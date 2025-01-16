import jwt  from "jsonwebtoken";
import { ApiError } from "../utils/Apierrors.js";
import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/userModel.js";

export const verifyjwt = asynchandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new ApiError(404, "unauthorized request")
        }
        const decodedToken = await jwt.verify(token, process.env.ACCESSS_TOKEN_SECRET)
    
        const user=User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(404,"invalid access token")
        }
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(404, "invalid access token")
        
    }
})

