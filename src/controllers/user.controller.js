import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { UploadFileOnCloudinary } from '../utils/cloudinary.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessTokenAndRefreshToken = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = await user.generateAccessToken();
    const RefreshToken = await user.generateRefreshToken();
    user.refreshToken = RefreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, RefreshToken };
  } catch (error) {
    throw new ApiError(401, error.message || 'failed to generate token');
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;

  // Validate inputs
  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, 'Please fill in all fields');
  }

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }

  // File uploads
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required');
  }
  const avatar = await UploadFileOnCloudinary(avatarLocalPath);
  const coverImage = await UploadFileOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, 'Avatar file is required');
  }

  // Testing Purposes
  console.log('Uploaded files:', req.files);
  console.log(avatar.url, coverImage.url);
  console.log('Uploading checkpoint');

  // Create user
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  // Fetch user details without sensitive data
  const createdUser = await User.findById(user._id).select('-password -refreshToken');
  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while registering the user');
  }

  // Return response
  return res.status(201).json(new ApiResponse(201, createdUser, 'User registered successfully'));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { username, email, password } = req.body;
  console.log('Request Body:', req.body);
  console.log('requested body', email, password, username);

  if (!username && !email) {
    throw new ApiError(400, 'username or email is required');
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, 'User not found');
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials');
  }
  const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id);
  const LoggedInUser = await User.findOne(user._id).select('-password -refreshToken');
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie('access_token', accessToken, options)
    .cookie('refresh_token', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: LoggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged In Successfully',
      ),
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findOneAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // removes the refresh token from the refresh token
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged Out'));
});

const RefreshTokenResponse = asyncHandler(async (req, res) => {
  const Incomingtoken = req.cookies.refreshToken || req.body.refreshToken;
  if (!Incomingtoken) {
    throw new ApiError(401, 'Invalid refresh token');
  }
  try {
    const decodedToken = jwt.verify(Incomingtoken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }
    if (Incomingtoken !== user?.refreshToken) {
      throw new ApiError(401, error.message || 'Invalid refresh token or expired token');
    }
    const { accessToken, newRefreshToken } = await generateAccessTokenAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };
    res.status(200).cookie('access_token', accessToken, options).cookie('refresh_token', newRefreshToken, options).json;
    {
      new ApiResponse(200),
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        'Access token refreshed';
    }
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldpassword, newpassword } = req.body;
  if (!(oldpassword && newpassword)) {
    throw new ApiError(401, 'Oldpassword & newpassword is required');
  }
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }
  const isValidPassword = await user.isPasswordCorrect(oldpassword);
  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid password');
  }
  await User.findOneAndUpdate(
    req.user,
    {
      $set: {
        password: newpassword,
      },
    },
    { new: true },
  );
  res.json(new ApiResponse(200, 'Password changed successfully'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // use middleware verifyJwt where I can have access to user._id
  const user = await User.findById(req.user?._id);
  res.json(new ApiResponse(200, user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { newfullName, newemail } = req.body;
  if (!(newfullName && newemail)) {
    throw new ApiError(401, 'Oldpassword & newpassword is required');
  }
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, 'User not found');
  }
  const UpdateDetailsUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName: newfullName,
        email: newemail,
      },
    },
    { new: true },
  );
  res.json(new ApiResponse(200, UpdateDetailsUser, 'Account details updated successfully'));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // use middlware of multer for req.file where to upload the single avatar
  const avatarlocalPath = req.file?.path;
  if (!avatarlocalPath) {
    throw new ApiError(401, 'Avatar Path is not found');
  }
  const avatar = await UploadFileOnCloudinary(avatarlocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true },
  );
  res.status(200).json(new ApiResponse(200, user.avatar, 'successfully updated Avatar'));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverlocalPath = req.file?.path;
  if (!CoverlocalPath) {
    throw new ApiError(401, 'CoverImage Path is not found');
  }
  const coverImage = await UploadFileOnCloudinary(CoverlocalPath);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: coverImage?.url,
      },
    },
    { new: true },
  );
  res.status(200).json(new ApiResponse(200, user.coverImage, 'successfully updated CoverImage'));
});

const getUserChannelProfile = asyncHandler(async(req, res) => {
  const {username} = req.params
  if (!username?.trim()) {
      throw new ApiError(400, "username is missing")
  }
  const channel = await User.aggregate([
      {
          $match: {
              username: username?.toLowerCase()
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers"
          }
      },
      {
          $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber",
              as: "subscribedTo"
          }
      },
      {
          $addFields: {
              subscribersCount: {
                  $size: "$subscribers"
              },
              channelsSubscribedToCount: {
                  $size: "$subscribedTo"
              },
              isSubscribed: {
                  $cond: {
                      if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                      then: true,
                      else: false
                  }
              }
          }
      },
      {
          $project: {
              fullName: 1,
              username: 1,
              subscribersCount: 1,
              channelsSubscribedToCount: 1,
              isSubscribed: 1,
              avatar: 1,
              coverImage: 1,
              email: 1
          }
      }
  ])
  if (!channel?.length) {
      throw new ApiError(404, "channel does not exists")
  }
  return res
  .status(200)
  .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
  )
})

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])
  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
})

export {
  registerUser,
  loginUser,
  logOutUser,
  RefreshTokenResponse,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
