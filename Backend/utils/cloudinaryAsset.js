const cloudinary = require("../config/cloudinary");

/* ===============================
   PUBLIC ID FROM URL
   https://res.cloudinary.com/<cloud>/image/upload/v123/pyro/products/x.jpg
   -> "pyro/products/x"
================================ */
const publicIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/upload\/(?:.*?\/)?v\d+\/(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
};

/* ===============================
   DELETE ASSET (BEST EFFORT)
   A failed cleanup must never fail the request
================================ */
exports.destroyAsset = async (url, resourceType = "image") => {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("CLOUDINARY DELETE ERROR:", error.message);
  }
};
