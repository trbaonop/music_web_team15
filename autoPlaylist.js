async function fetchCloudSongs() {
  console.log("🔍 Đang tải danh sách nhạc từ server...");
  try {
    const res = await fetch("http://localhost:3000/api/music");
    const data = await res.json();

    if (!data.success) throw new Error(data.message);

    const songs = data.songs;
    console.log("✅ Danh sách nhận được:", songs);

    localStorage.setItem("KEY_PLAY_LIST", JSON.stringify(songs));
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách nhạc:", err);
  }
}

fetchCloudSongs();
