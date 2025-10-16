'use strict';

console.log("🔍 Đang tải danh sách nhạc từ server...");

(async () => {
  try {
    const res = await fetch("http://localhost:3000/api/music"); // API từ server.js
    const data = await res.json();

    if (!data.success) {
      console.error("❌ Lỗi API:", data.message);
      return;
    }

    console.log("✅ Danh sách nhận được:", data.songs);

    const songs = data.songs.map(song => {
  const safeName = song.name.replace(/[\\/:*?"<>|]/g, "_");
  return {
    id: song.id,
    name: song.name,
    author: song.author || "Không rõ",
    album: song.album || "Cloudinary",
    musicPath: song.url, // ⚡ phải có dòng này!
    imgPath_70: `./data/imgs/${safeName}.jpg`,
    imgPath_200: `./data/imgs/${safeName}.jpg`,
    imgPath_400: `./data/imgs/${safeName}.jpg`,
    time: song.time || "00:00",
  };
});

    // 💾 Lưu danh sách vào localStorage cho web player đọc
    localStorage.setItem("KEY_PLAY_LIST", JSON.stringify(songs));
    console.log("💾 Đã cập nhật KEY_PLAY_LIST trong localStorage");

  } catch (err) {
    console.error("❌ Lỗi tải danh sách nhạc:", err);
  }
})();
