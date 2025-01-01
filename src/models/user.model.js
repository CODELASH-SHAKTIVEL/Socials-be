import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unqiue: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unqiue: true,
    },
    fullName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreshToken: {
      type: String,
      required: true,
    },
    watchHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
    },
  },
  {
    timestamps: true,
  },
);

export const User = new mongoose.model('User', UserSchema);

// mongoDB convertes the User to users [ lowercase and s for plural]
// Watch history saves the id of the video as will go on watching the video
