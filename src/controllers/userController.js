
import { User } from '../models/useModel.js';
import { ApiError } from '../utils/Apierrors.js';
import { aysnhandler } from '../utils/asynhandler.js'
import { uploadCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/Apiresponse.js';

const registerUser = aysnhandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;


    console.log("body:", req.body)
    console.log("email:", email)
    console.log( "passowrd : ", password);

    // validation

    if (
        [fullName, email, password, username].some((field) => {
            return field === ""
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

    console.log("files  : ", req.files)

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
        avatar: avatar.url,
        coverImage:  coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    console.log("user : ", user)
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    console.log("created user : ", createdUser)

    if (!createdUser) {
        throw new ApiError(500, "something went wrong");
    }



    return res.status(200).json(
        new ApiResponse(200, createdUser, "user successfully created")
    )
})

export { registerUser }