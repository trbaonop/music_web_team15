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

const IMG_ROOT = path.join(process.cwd(), "data", "imgs");
const IMG_SONG_DIR = path.join(IMG_ROOT, "songs");
const IMG_SINGER_DIR = path.join(IMG_ROOT, "singers");
const DEFAULT_IMG = path.join(IMG_ROOT, "default.jpg");
const RENAME_FLAG = path.join(IMG_ROOT, ".renamed");

let fileMappings = { songs: {}, singers: {} };

function normalizeName(name) {
  if (!name) return "";
  return name
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s\u00C0-\u1EF9]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanForMatch(name) {
  if (!name) return "";
  let s = name.replace(/\.[^/.]+$/, "");
  s = s.replace(/[_\-]+/g, " ");
  s = s.replace(/\b(HD|HQ|CLUB|MIX|REMIX|OFFICIAL|AUDIO|VIDEO|VIETSUB|SUB|LYRICS|KARAOKE|COVER)\b/gi, "");
  s = s.replace(/\s+[0-9a-z]{5,}\s*$/i, "");
  s = s.replace(/^[-_ ]+|[-_ ]+$/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function cleanForDisplay(name) {
  if (!name) return "";
  let s = name.replace(/\.[^/.]+$/, "");
  s = s.replace(/[_\-]+/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function normalizeForFile(name) {
  if (!name) return "";
  let result = name
    .replace(/[^a-zA-Z0-9\s\u00C0-\u1EF9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  result = result.replace(/\s+/g, "-");
  return result;
}

function listFiles(folder) {
  try {
    if (!fs.existsSync(folder)) {
      console.log(`Thư mục ${folder} không tồn tại`);
      return [];
    }
    return fs.readdirSync(folder).filter(f => fs.statSync(path.join(folder, f)).isFile());
  } catch (e) {
    console.error(`Lỗi đọc thư mục ${folder}:`, e.message);
    return [];
  }
}

function createFileMappings(dir, mappingsKey, renameLog) {
  if (!fs.existsSync(dir)) {
    console.log(`Thư mục ${dir} không tồn tại, bỏ qua ánh xạ`);
    return;
  }
  const files = listFiles(dir);
  fileMappings[mappingsKey] = {};
  files.forEach(file => {
    if (file === "default.jpg") return;
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const cleaned = base.replace(/\b(HD|HQ|CLUB|MIX|REMIX|OFFICIAL|AUDIO|VIDEO|VIETSUB|SUB|LYRICS|KARAOKE|COVER)\b/gi, "")
                       .replace(/\s+[0-9a-z]{5,}\s*$/i, "")
                       .replace(/\s+/g, " ")
                       .trim();
    const newBase = normalizeForFile(cleaned);
    const newFile = `${newBase}${ext}`;
    if (newFile !== file) {
      fileMappings[mappingsKey][file] = newFile;
      console.log(`Ánh xạ: ${file} → ${newFile}`);
      renameLog.push({ dir, original: file, normalized: newFile });
    } else {
      fileMappings[mappingsKey][file] = file;
    }
  });
}

function autoCreateMappings() {
  let shouldCreate = !fs.existsSync(RENAME_FLAG);
  if (fs.existsSync(RENAME_FLAG)) {
    try {
      const flagContent = JSON.parse(fs.readFileSync(RENAME_FLAG, "utf8"));
      if (!flagContent.timestamp || !Array.isArray(flagContent.mappings)) {
        console.log("File .renamed không hợp lệ, tạo lại ánh xạ");
        shouldCreate = true;
      } else {
        console.log("Đã có ánh xạ trước đó, tải lại");
        fileMappings = { songs: {}, singers: {} };
        flagContent.mappings.forEach(({ dir, original, normalized }) => {
          const key = dir.includes("songs") ? "songs" : "singers";
          fileMappings[key][original] = normalized;
        });
      }
    } catch (e) {
      console.log("Lỗi đọc .renamed, tạo lại ánh xạ:", e.message);
      shouldCreate = true;
    }
  }

  if (shouldCreate) {
    console.log("Bắt đầu tạo ánh xạ cho thư mục songs và singers...");
    const renameLog = [];
    createFileMappings(IMG_SONG_DIR, "songs", renameLog);
    createFileMappings(IMG_SINGER_DIR, "singers", renameLog);
    fs.writeFileSync(
      RENAME_FLAG,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        mappings: renameLog
      }, null, 2)
    );
    console.log("Hoàn tất tạo ánh xạ, ghi log vào .renamed");
  }
}

autoCreateMappings();

function findBestMatch(name, folder, mappingsKey) {
  const normalized = normalizeName(cleanForMatch(name));
  const files = listFiles(folder);
  if (!files.length) {
    console.log(`No files in ${folder}, returning default image`);
    return DEFAULT_IMG;
  }

  let best = null;
  let bestScore = 0;

  for (const file of files) {
    const base = file.substring(0, file.lastIndexOf(".")) || file;
    const normalizedFile = fileMappings[mappingsKey][file] || file;
    const normalizedBase = normalizeName(cleanForMatch(normalizedFile.substring(0, normalizedFile.lastIndexOf(".")) || normalizedFile));

    if (!normalizedBase) continue;

    if (normalized === normalizedBase) {
      console.log(`Exact match for ${name}: ${file}`);
      return path.join(folder, file);
    }

    if (normalized.includes(normalizedBase) || normalizedBase.includes(normalized)) {
      const lenRatio = Math.min(normalizedBase.length, normalized.length) / Math.max(normalizedBase.length || 1, normalized.length || 1);
      const score = lenRatio * 2.0;
      if (score > bestScore) {
        bestScore = score;
        best = file;
      }
      continue;
    }

    const tokensN = normalized.split(" ");
    const tokensB = normalizedBase.split(" ");
    const common = tokensB.filter(t => tokensN.includes(t)).length;
    const score = common / Math.max(tokensB.length, 1) + (tokensN[0] === tokensB[0] ? 0.5 : 0);

    if (score > bestScore) {
      bestScore = score;
      best = file;
    }
  }

  if (bestScore < 0.8 || !best) {
    console.log(`No good match for ${name} (score ${bestScore}), fallback default`);
    return DEFAULT_IMG;
  }

  console.log(`Best match for ${name}: ${best} (score ${bestScore})`);
  return path.join(folder, best);
}

function extractSongAndArtist(fullNameRaw, singerFolder) {
  const cleanedForMatch = cleanForMatch(fullNameRaw);
  const cleanedForDisplay = cleanForDisplay(fullNameRaw);
  const normalizedFull = normalizeName(cleanedForMatch);

  console.log(`Processing raw name: ${fullNameRaw}`);

  if (!normalizedFull) return { song: cleanedForDisplay || fullNameRaw, artist: cleanedForDisplay || "Không rõ" };

  const singerFiles = listFiles(singerFolder);
  let songCandidate = cleanedForDisplay;
  let artist = cleanedForDisplay;

  const knownArtists = singerFiles.map(file => {
    const base = file.substring(0, file.lastIndexOf(".")) || file;
    const normalizedBase = fileMappings.singers[file] ? fileMappings.singers[file].substring(0, fileMappings.singers[file].lastIndexOf(".")) : base;
    return { base: cleanForDisplay(base), nbase: normalizeName(cleanForMatch(normalizedBase)) };
  });

  const nameParts = cleanedForDisplay.split(/\s+/);
  let bestMatchLength = 0;
  for (let i = nameParts.length - 1; i >= 0; i--) {
    for (let j = i; j < nameParts.length; j++) {
      const part = nameParts.slice(i, j + 1).join(" ");
      const nPart = normalizeName(cleanForMatch(part));
      for (const { base, nbase } of knownArtists) {
        if (nPart === nbase || nbase.includes(nPart) || nPart.includes(nbase)) {
          const lenRatio = Math.min(nbase.length, nPart.length) / Math.max(nbase.length || 1, nPart.length || 1);
          if (lenRatio > 0.7 && part.length > bestMatchLength) {
            artist = base;
            bestMatchLength = part.length;
            songCandidate = nameParts.slice(0, i).join(" ").trim() || cleanedForDisplay.replace(new RegExp(`\\b${base}\\b`, "i"), "").trim();
            break;
          }
        }
      }
      if (artist !== cleanedForDisplay) break;
    }
    if (artist !== cleanedForDisplay) break;
  }

  if (artist === cleanedForDisplay) {
    songCandidate = cleanedForDisplay;
    artist = "Không rõ";
  }

  songCandidate = cleanForDisplay(songCandidate);

  console.log(`Extracted: song=${songCandidate}, artist=${artist}`);
  return { song: songCandidate, artist: artist };
}

function toUrlPath(absPath) {
  const rel = path.relative(process.cwd(), absPath).replace(/\\/g, "/");
  return "/" + rel;
}

router.get("/music", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      resource_type: "video",
      type: "upload",
      prefix: "",
      max_results: 500,
    });

    if (!result.resources) {
      console.error("No resources returned from Cloudinary");
      return res.status(500).json({ success: false, message: "No resources found" });
    }

    const songs = result.resources
      .filter(r => r.format === "mp3")
      .map((r, i) => {
        const rawPublicId = decodeURIComponent(r.public_id.split("/").pop());
        const info = extractSongAndArtist(rawPublicId, IMG_SINGER_DIR);

        const songImgAbs = findBestMatch(info.song || cleanForMatch(rawPublicId), IMG_SONG_DIR, "songs");
        const singerImgAbs = info.artist && info.artist !== "Không rõ"
          ? findBestMatch(info.artist, IMG_SINGER_DIR, "singers")
          : DEFAULT_IMG;

        const imgSongUrl = toUrlPath(songImgAbs);
        const imgSingerUrl = toUrlPath(singerImgAbs);

        const songFileName = path.basename(songImgAbs, path.extname(songImgAbs));
        const singerFileName = path.basename(singerImgAbs, path.extname(singerImgAbs));

        return {
          id: i + 1,
          rawName: rawPublicId,
          name: songFileName || cleanForDisplay(rawPublicId),
          author: info.artist || "Không rõ", 
          label: r.tags?.find(t => t.startsWith('label:'))?.substring(6) || 'Unknown Label', // thêm label
          album: "Cloudinary",
          musicPath: r.secure_url,
          imgSong: imgSongUrl,
          imgSinger: imgSingerUrl,
          time: r.duration ? Math.round(r.duration) + "s" : "00:00",
        };
      });

    const artists = [...new Set(songs.map(song => song.author))]
      .filter(artist => artist !== "Không rõ")
      .map(artist => ({
        name: artist,
        imgSinger: songs.find(song => song.author === artist)?.imgSinger || toUrlPath(DEFAULT_IMG),
      }));
    
    artists.unshift({ name: "all", imgSinger: toUrlPath(DEFAULT_IMG) });

    console.log("Artists sent to client:", JSON.stringify(artists, null, 2));

    res.json({ success: true, songs, artists });
  } catch (err) {
    console.error("❌ Lỗi Cloudinary API:", err.message || err);
    res.status(500).json({ success: false, message: err.message || "Unknown error" });
  }
});

export default router;