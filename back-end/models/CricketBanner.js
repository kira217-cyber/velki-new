import mongoose from "mongoose";

const cricketBannerSchema = new mongoose.Schema({
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

const CricketBanner = mongoose.model("CricketBanner", cricketBannerSchema);
export default CricketBanner;