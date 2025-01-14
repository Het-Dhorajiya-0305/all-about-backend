
import { User } from '../models/userModel.js';
import { ApiError } from '../utils/Apierrors.js';
import { asynchandler } from '../utils/asynchandler.js'
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

const registerUser = asynchandler(async (req, res) => {
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

const loginUser = asynchandler(async (req, res) => {
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

const logoutUser = asynchandler(async (req, res) => {
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

const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized token")
    }
    console.log("incomming token : ", incomingRefreshToken)
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    console.log("decoded token", decodedToken)
    const user = User.findById(decodedToken?._id);
    if (!user) {
        throw new ApiError(404, "invald refresh token")
    }

    console.log("user refreshTOken :", user.refreshToken)
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

})

const changeCurrentPassword = asynchandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "user does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invlid password");
    }
    if (oldPassword === newPassword) {
        throw new ApiError(404, "password same as previou");
    }



    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { newPassword }, "password update succesfully")
        )
})

const currentUser = asynchandler(async (req, res) => {
    return res
        .status(200)
        .json(200, req.user, "current user fetched successfully!")
})

const updateAccountDetail = asynchandler(async (req, res) => {
    const { fullName, email } = req.body;
    if (!fullName && !email) {
        throw new ApiError(400, "all field are required")
    }
    const updatedUser = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }).select("-passowrd");
    return res.status(200)
        .json(
            new ApiResponse(200, user, "account detail updated successfully")
        )
})

const updateUserAvatar = asynchandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is missing!!")
    }

    const avatar = await uploadCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(500, "error in uploading avatar!!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "avatar change successfully!!")
        )

})

const updateUserCoverImage = asynchandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "avatar file is missing!!")
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError(500, "error in uploading avatar!!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "coverImage change successfully!!")
        )

})



export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, currentUser, updateAccountDetail, updateUserAvatar }