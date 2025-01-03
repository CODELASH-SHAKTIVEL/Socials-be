import {asyncHandler} from '../utils/AsyncHandler.js'

const registeruser = asyncHandler( async (req ,res) => {
    res.status(200).json({
        message : "User Registered Successfully"
    })
})

export {
    registeruser,
}