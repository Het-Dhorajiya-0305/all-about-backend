import {aysnhandler} from '../utils/asynhandler.js'

const registerUser=aysnhandler(async (req,res)=>
{
    res.status(200).json({
        message:"succesfully connect and check api"
    })
})

export {registerUser}