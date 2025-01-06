
import mongoose, { Schema } from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            require: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            require: true,
            lowercase: true,
            unique: true,
            trim: true,
        },
        fullname: {
            type: String,
            require: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            require: true,
        },
        coverimage: {
            type: String,
        },
        password: {
            type: String,
            require: [true, "password is required"],
            unique: true,
            trim: true,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "video"
            }
        ],
        refreshToken: String
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function () {
    if (this.ismodified("password")) {

        this.password = bcrypt.hash(this.password, 10)
    }
    next()
})

userSchema.methods.ispassWordCorrect=async function (password) {
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccesstoken=function (){
        return jwt.sign(
            { 
                _id:this._id,
                username:this.username,
                fullname:this.fullname,
                email:this.email
            },
            process.env.ACCESSS_TOKEN_SECRET,
            {
                expriresIn:process.env.ACCESS_TOKEN_EXPIRY
            }
        )
}
userSchema.methods.generateRefreshtoken=function (){
    return jwt.sign(
        {
            _id:this._id,
            username:this.username,
            fullname:this.fullname,
            email:this.email
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expriresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", userSchema);
export default User;