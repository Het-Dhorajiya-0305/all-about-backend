import jwt  from "jsonwebtoken";
import { ApiError } from "../utils/Apierrors.js";
import { aysnhandler } from "../utils/asynhandler.js";
import { User } from "../models/useModel.js";

export const verifyjwt = aysnhandler(async (req, res, next) => {
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

