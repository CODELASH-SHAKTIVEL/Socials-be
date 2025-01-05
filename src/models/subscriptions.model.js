import mongoose from "mongoose";
const SubscriptionSchema = mongoose.Schema(
    {
      subscriptions:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
      },
      Channel:{
        type:mongoose.schema.Types.ObjectId,
        ref:'User'
      }
    },
    {
        timestamps: true,
      },
)

export const Subsciption = mongoose.model("Subsciption", SubscriptionSchema)