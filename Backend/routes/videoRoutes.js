const router = require("express").Router();
const {
  uploadVideo,
  getVideos,
  getAdminVideos,
  updateVideo,
  deleteVideo,
  restoreVideo,
} = require("../controllers/videoController");
const {verifyToken,isAdmin} = require('../middleware/authMiddleware')

router.post("/upload", verifyToken, isAdmin, uploadVideo);
router.get("/admin", verifyToken, isAdmin, getAdminVideos);      // ?type= &status=
router.put("/:id", verifyToken, isAdmin, updateVideo);
router.delete("/:id", verifyToken, isAdmin, deleteVideo);        // soft delete
router.patch("/:id/restore", verifyToken, isAdmin, restoreVideo);

router.get("/", getVideos);

module.exports = router;
