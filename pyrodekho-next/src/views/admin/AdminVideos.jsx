"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import Loader from "@/components/Loader";
import { useConfirm } from "@/components/ConfirmDialog";
import { adminFetch, adminMutate } from "@/lib/adminApi";
import { VIDEO_TYPES, labelFor, isActive } from "@/lib/adminOptions";

const STATUS_TABS = [
  ["active", "Active"],
  ["deleted", "Deleted"],
  ["all", "All"],
];

const matchesStatus = (video, status) =>
  status === "all" || (status === "active") === isActive(video);

// One video with view / edit modes. onChange(updatedVideo) replaces it in the list.
function AdminVideoCard({ video, onChange }) {
  const active = isActive(video);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [type, setType] = useState(video.type);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const { confirm, confirmDialog } = useConfirm();

  const startEdit = () => {
    setTitle(video.title);
    setType(video.type);
    setFile(null);
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a video title ❗");
      return;
    }
    if (file && !file.type.startsWith("video/")) {
      toast.error("Only video files are allowed ❌");
      return;
    }

    setBusy(true);
    const toastId = toast.loading(file ? "Uploading new video..." : "Saving changes...");
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("type", type);
      if (file) fd.append("video", file);

      const res = await adminMutate(`/videos/${video._id}`, { method: "PUT", body: fd, refresh: "videos" });
      onChange(res.data);
      setEditing(false);
      toast.success("Video updated ✅", { id: toastId });
    } catch (err) {
      toast.error(err.message || "Something went wrong ❌", { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  // Soft delete or restore
  const setActive = async (makeActive) => {
    if (!makeActive && !(await confirm({
      title: `Delete "${video.title}"?`,
      message: "It will be hidden from the site. You can restore it later from the Deleted tab.",
      confirmLabel: "Yes, delete",
    }))) {
      return;
    }

    setBusy(true);
    try {
      const res = makeActive
        ? await adminMutate(`/videos/${video._id}/restore`, { method: "PATCH", refresh: "videos" })
        : await adminMutate(`/videos/${video._id}`, { method: "DELETE", refresh: "videos" });
      onChange(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message || "Something went wrong ❌");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={`adm-vlist-card ${active ? "" : "is-deleted"}`}>
      {confirmDialog}
      <video src={video.videoUrl} controls preload="metadata" playsInline />

      {editing ? (
        <form className="adm-vlist-form" onSubmit={save}>
          <label htmlFor={`vt-${video._id}`}>Title</label>
          <input id={`vt-${video._id}`} value={title} onChange={(e) => setTitle(e.target.value)} />

          <label htmlFor={`vc-${video._id}`}>Category</label>
          <select id={`vc-${video._id}`} value={type} onChange={(e) => setType(e.target.value)}>
            {VIDEO_TYPES.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <label htmlFor={`vf-${video._id}`}>Replace video (optional)</label>
          <input
            id={`vf-${video._id}`}
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />

          <div className="adm-actions">
            <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button type="button" className="adm-btn" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="adm-vlist-body">
          <h3>{video.title}</h3>
          <p>
            {labelFor(VIDEO_TYPES, video.type)}
            {!active && <span className="adm-badge">Deleted</span>}
          </p>

          <div className="adm-actions">
            <button type="button" className="adm-btn" disabled={busy} onClick={startEdit}>Edit</button>
            {active ? (
              <button type="button" className="adm-btn adm-btn-danger" disabled={busy} onClick={() => setActive(false)}>
                Delete
              </button>
            ) : (
              <button type="button" className="adm-btn adm-btn-success" disabled={busy} onClick={() => setActive(true)}>
                Restore
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function AdminVideos() {
  const [videos, setVideos] = useState(null);
  const [error, setError] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    adminFetch("/videos/admin")
      .then((res) => setVideos(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="adm-empty"><p>{error}</p></div>;
  if (!videos) return <Loader />;

  const visible = videos.filter(
    (v) => matchesStatus(v, status) && (!type || v.type === type)
  );

  const replaceVideo = (updated) =>
    setVideos((list) => list.map((v) => (v._id === updated._id ? updated : v)));

  return (
    <div className="adm-vlist">
      <div className="adm-page-head">
        <h1>Videos</h1>
        <Link href="/admin/add-video" className="adm-btn adm-btn-primary">+ Upload Video</Link>
      </div>

      <div className="adm-tabs" role="tablist">
        {STATUS_TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={status === key}
            className={`adm-tab ${status === key ? "active" : ""}`}
            onClick={() => setStatus(key)}
          >
            {label} ({videos.filter((v) => matchesStatus(v, key)).length})
          </button>
        ))}
      </div>

      <div className="adm-toolbar">
        <select aria-label="Filter by category" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All categories</option>
          {VIDEO_TYPES.map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="adm-empty"><p>No videos found.</p></div>
      ) : (
        <ul className="adm-vlist-grid">
          {visible.map((v) => (
            <AdminVideoCard key={v._id} video={v} onChange={replaceVideo} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminVideos;
