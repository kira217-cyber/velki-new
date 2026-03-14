import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  gameId: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;