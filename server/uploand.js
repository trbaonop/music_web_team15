import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

router.use(cors());

// 📂 Đường dẫn tới thư mục ảnh local
const IMG_DIR = path.join(process.cwd(), "data", "imgs");

// === API: /api/music ===
router.get("/music", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: "video", // Cloudinary xem mp3 là video
      type: "upload",
      prefix: "",
      max_results: 100,
    });

    const songs = result.resources
      .filter((r) => r.format === "mp3")
      .map((r, i) => {
        const baseName = decodeURIComponent(r.public_id.split("/").pop());

        // 🔍 tìm file ảnh local trùng tên bài nhạc
        const imgFile = fs.readdirSync(IMG_DIR).find((f) => {
          const imgBase = f.substring(0, f.lastIndexOf(".")); // bỏ đuôi .jpg
          return imgBase.toLowerCase() === baseName.toLowerCase();
        });

        // Nếu có ảnh trùng tên → lấy, nếu không → default
        const imgPath = imgFile
          ? `./data/imgs/${imgFile}`
          : "./data/imgs/default.jpg";

        return {
          id: i + 1,
          name: baseName,
          url: r.secure_url,
          author: "Không rõ",
          album: "Cloudinary",
          musicPath: r.secure_url,
          imgPath_70: imgPath,
          imgPath_200: imgPath,
          imgPath_400: imgPath,
          time: "00:00",
        };
      });

    res.json({ success: true, songs });
  } catch (err) {
    console.error("❌ Lỗi Cloudinary API:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
