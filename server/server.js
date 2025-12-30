import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cloudApi from "./uploand.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, "..")));
app.use("/data/imgs", express.static(path.join(__dirname, "data", "imgs")));
app.use("/api", cloudApi);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server chạy tại http://localhost:${PORT}`));
