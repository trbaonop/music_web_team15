import express from "express";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

router.use(cors());

// API: /api/music
router.get("/music", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: "video", // Cloudinary xem mp3 là video
      type: "upload",
      prefix: "", // có thể thêm "music/" nếu bạn để nhạc trong thư mục
      max_results: 100,
    });

    const songs = result.resources
      .filter((r) => r.format === "mp3")
      .map((r, i) => ({
        id: i + 1,
        name: decodeURIComponent(r.public_id.split("/").pop()),
        author: "Không rõ",
        album: "Cloudinary",
        musicPath: r.secure_url,
        imgPath_70: `./data/imgs/music_${i + 1}-70x70.jpg`,
        imgPath_200: `./data/imgs/music_${i + 1}-200x200.jpg`,
        imgPath_400: `./data/imgs/music_${i + 1}-400x400.jpg`,
        time: "00:00",
      }));

    res.json({ success: true, songs });
  } catch (err) {
    console.error("❌ Lỗi Cloudinary API:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
