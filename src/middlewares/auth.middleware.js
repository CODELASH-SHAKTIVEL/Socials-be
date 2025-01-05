import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token:', token);

    if (!token) {
      throw new ApiError(401, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log('Decoded Token:', decodedToken);

    const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
    console.log('User:', user);

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Error:', error);
    throw new ApiError(401, error?.message || 'Invalid access token');
  }
});

export {
    verifyJwt
}
