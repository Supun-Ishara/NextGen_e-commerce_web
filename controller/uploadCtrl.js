// const fs = require("fs");
// const asyncHandler = require("express-async-handler");
// const { cloudinaryUploadImg, cloudinaryDeleteImg } = require("../utils/cloudinary");

// const uploadImages = asyncHandler( async (req, res) => {
//     try {
//       const uploader = (path) => cloudinaryUploadImg(path, "images");
//       const urls = [];
//       const files = req.files;
//       for (const file of files) {
//         const { path } = file;
//         const newpath = await uploader(path);
//         urls.push(newpath);
//         fs.unlinkSync(path);

//      }
//      const images = urls.map((file) => {
//        return file;
//      });
//      res.json(images);
//      }
//     catch (error) {
//       throw new Error(error);
//     }
// });

// const deleteImages = asyncHandler( async (req, res) => {
//   const { id } = req.params;
//   try {
//     const deleted = cloudinaryDeleteImg(id, "images");
//     res.json( {message: "Deleted"} );
//    }
//   catch (error) {
//     throw new Error(error);
//   }
// });

// module.exports = {
//     uploadImages,
//     deleteImages,
// };

const asyncHandler = require("express-async-handler");
const { cloudinaryUploadImg, cloudinaryDeleteImg } = require("../utils/cloudinary");
const fs = require("fs").promises;
const path = require("path");

const uploadImages = asyncHandler(async (req, res) => {
  try {
    const uploader = (path) => cloudinaryUploadImg(path, "images");
    const urls = [];
    const files = req.files;

    for (const file of files) {
      const processedPath = file.processedPath || file.path;
      const newpath = await uploader(processedPath);
      urls.push(newpath);
      
      // Clean up the processed file
      try {
        await fs.unlink(processedPath);
      } catch (error) {
        console.error("Error deleting processed file:", error);
      }
    }

    const images = urls.map((file) => file);
    res.json(images);
  } catch (error) {
    throw new Error(error.message);
  }
});

const deleteImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await cloudinaryDeleteImg(id, "images");
    res.json({ message: "Deleted" });
  } catch (error) {
    throw new Error(error.message);
  }
});

module.exports = {
  uploadImages,
  deleteImages,
};