import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cloudApi from "./uploand.js";
import dotenv from "dotenv";

dotenv.config();
console.log("🌤️ Cloudinary config:", process.env.CLOUD_NAME);

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, ".."))); // phục vụ index.html
app.use("/api", cloudApi);

// Bỏ CSP nếu trình duyệt chặn script
app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
