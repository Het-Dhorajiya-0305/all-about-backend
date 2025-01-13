
import { User } from '../models/useModel.js';
import { ApiError } from '../utils/Apierrors.js';
import { aysnhandler } from '../utils/asynhandler.js'
import { uploadCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/Apiresponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefereshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()


        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = aysnhandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;




    // validation

    if (
        [fullName, email, password, username].some((field) => {
            return field?.trim() === ""
        })
    ) {
        throw ApiError(400, "All fields are required")
    }


    // check user is exist or not 

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // how to access image file

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;


    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is mandotary");
    }


    // upoloading image on cloudinary

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(500, "Image uploading failed");
    }

    // creating object of user data

    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || ""

    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );



    if (!createdUser) {
        throw new ApiError(500, "something went wrong");
    }



    return res.status(200).json(
        new ApiResponse(200, createdUser, "user successfully created")
    )
})

const loginUser = aysnhandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, username, password } = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")
    }

    console.log("user id = ", user._id)

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})

const logoutUser = aysnhandler(async (req, res) => {
    const userId = req.user._id;
    await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        })

    const option = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(
            new ApiResponse(200, {}, "user logged out successfully")
        )

})

const refreshAccessToken = aysnhandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized token")
    }
    console.log("incomming token : ", incomingRefreshToken)
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        console.log()
        const user = User.findById(decodedToken._id);
        if (!user) {
            throw new ApiError(404, "invald refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(404, "incorrect refresh token")
        }

        const option = {
            httpOnlt: true,
            secure: ture
        }
            ;
        const { accessToken, newRefreshtoken } = await generateAccessAndRefereshTokens(user_id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, option)
            .cookie("refreshToken", newRefreshtoken, option)
            .json(
                new ApiResponse(200, { accessToken, refreshToken: newRefreshtoken }, "session is continue again")
            )
    } catch (error) {
        throw new ApiError(404, error?.message || "invalid refresh token")
    }


})

export { registerUser, loginUser, logoutUser, refreshAccessToken }