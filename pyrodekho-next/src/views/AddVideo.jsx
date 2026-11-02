"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { adminMutate } from "@/lib/adminApi";

function AddVideo() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("home");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const uploadVideo = async () => {
    /* =====================
       VALIDATION
    ===================== */
    if (!title.trim()) {
      toast.error("Please enter a video title ❗");
      return;
    }

    if (!file) {
      toast.error("Please select a video file 📹");
      return;
    }

    if (!file.type.startsWith("video/")) {
      toast.error("Only video files are allowed ❌");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Uploading video...");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);
      formData.append("video", file);

      await adminMutate("/videos/upload", {
        method: "POST",
        body: formData,
        refresh: "videos",
      });

      toast.success("Video uploaded successfully 🎉", {
        id: toastId,
      });

      // reset form
      setTitle("");
      setFile(null);
      setType("home");
    } catch (err) {
      console.error(err);
      toast.error(
        err.message || "Something went wrong while uploading video ❌",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-video-page">
      <div className="add-video-card">
        <h2 className="add-video-title">Upload New Video</h2>
        <p className="add-video-subtitle">
          Upload videos to Cloudinary and display them on your website
        </p>

        <label>Video Title *</label>
        <input
          type="text"
          placeholder="Enter video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label>Video Category *</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="home">Home Page</option>
          <option value="event">Event / Wedding</option>
          <option value="cracker">Cracker Testing</option>
        </select>

        <label>Upload Video *</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={uploadVideo} disabled={loading}>
          {loading ? "Uploading..." : "Upload Video"}
        </button>
      </div>
    </div>
  );
}

export default AddVideo;
