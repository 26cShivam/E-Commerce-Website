const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const Video = require("../models/Video");
const { destroyAsset } = require("../utils/cloudinaryAsset");

// Videos created before soft delete have no isActive field, so match
// "not false" rather than "true"
const ACTIVE = { isActive: { $ne: false } };

/* ===============================
   UPLOAD VIDEO (ADMIN)
================================ */
exports.uploadVideo = async (req, res) => {
  try {
    const { title, type } = req.body;

    /* ---------- Validation ---------- */
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Title and type are required",
      });
    }

    if (!req.files || !req.files.video) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    const videoFile = req.files.video;

    /* ---------- Upload to Cloudinary ---------- */
    const uploadResult = await cloudinary.uploader.upload(
      videoFile.tempFilePath,
      {
        resource_type: "video",
        folder: "pyro/videos",
      }
    );

    if (!uploadResult?.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Video upload failed",
      });
    }

    /* ---------- Save to DB ---------- */
    const video = await Video.create({
      title: title.trim(),
      type,
      videoUrl: uploadResult.secure_url,
    });

    /* ---------- Response ---------- */
    return res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: video,
    });
  } catch (error) {
    console.error("UPLOAD VIDEO ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ===============================
   GET VIDEOS (PUBLIC)
================================ */
exports.getVideos = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = type ? { ...ACTIVE, type } : ACTIVE;

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("GET VIDEOS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ===============================
   GET ALL VIDEOS (ADMIN)
   ?type=  ?status=active|inactive  (default: all)
================================ */
exports.getAdminVideos = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status === "active") Object.assign(filter, ACTIVE);
    if (status === "inactive") filter.isActive = false;

    const videos = await Video.find(filter)
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("ADMIN GET VIDEOS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ===============================
   UPDATE VIDEO (ADMIN)
   Only fields that are sent get updated; a new file replaces the old one
================================ */
exports.updateVideo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid video id" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    const { title, type } = req.body;

    /* ---------- Validation ---------- */
    if (title !== undefined && !title.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title cannot be empty" });
    }

    if (type !== undefined && !type.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Type cannot be empty" });
    }

    if (title !== undefined) video.title = title.trim();
    if (type !== undefined) video.type = type;

    /* ---------- Video Replace ---------- */
    const oldVideoUrl = video.videoUrl;
    if (req.files?.video) {
      const uploadResult = await cloudinary.uploader.upload(
        req.files.video.tempFilePath,
        { resource_type: "video", folder: "pyro/videos" }
      );
      video.videoUrl = uploadResult.secure_url;
    }

    await video.save();

    // Remove the old file only after the new one is saved
    if (req.files?.video && oldVideoUrl) {
      await destroyAsset(oldVideoUrl, "video");
    }

    return res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: video,
    });
  } catch (error) {
    console.error("UPDATE VIDEO ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ===============================
   DELETE / RESTORE VIDEO (ADMIN)
   Soft delete: the video and its file are kept
================================ */
const setVideoActive = (isActive) => async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid video id" });
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { returnDocument: "after" }
    );
    if (!video) {
      return res
        .status(404)
        .json({ success: false, message: "Video not found" });
    }

    return res.status(200).json({
      success: true,
      message: isActive ? "Video restored" : "Video deleted",
      data: video,
    });
  } catch (error) {
    console.error("SET VIDEO ACTIVE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.deleteVideo = setVideoActive(false);
exports.restoreVideo = setVideoActive(true);
