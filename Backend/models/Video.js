const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    title: String,
    type: String, // home, event, cracker
    videoUrl: String,

    // Soft delete: hidden from the site when false, restorable by admin
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Video", videoSchema);
