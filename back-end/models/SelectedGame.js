import mongoose from "mongoose";

const selectedGameSchema = new mongoose.Schema(
  {
    // external API থেকে আসা game _id string হিসেবে save করা better
    gameId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    isCatalog: { type: Boolean, default: false },
    isLatest: { type: Boolean, default: false },
    isA_Z: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("SelectedGame", selectedGameSchema);
