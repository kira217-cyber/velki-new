import mongoose from "mongoose";

const soccerBannerSchema = new mongoose.Schema({
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

const SoccerBanner = mongoose.model("SoccerBanner", soccerBannerSchema);
export default SoccerBanner;