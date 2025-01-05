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
      $set: {
        refreshToken: undefined,
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

export { registerUser, loginUser, logOutUser, RefreshTokenResponse };
