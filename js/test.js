// test.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 test.js đã chạy");

  // 🔥 Xoá danh sách cũ để đảm bảo load mới
  localStorage.removeItem("KEY_COLLECT_LIST");

  // ⏱ Đợi 0.5s để autoPlayList.js lưu KEY_PLAY_LIST
  setTimeout(() => {
    const playListRaw = localStorage.getItem("KEY_PLAY_LIST");
    console.log("📦 KEY_PLAY_LIST raw:", playListRaw);

    if (!playListRaw) {
      console.warn("⚠️ Không tìm thấy KEY_PLAY_LIST trong localStorage!");
      return;
    }

    const playList = JSON.parse(playListRaw);
    console.log("🎶 Danh sách KEY_PLAY_LIST:", playList);

    const container = document.querySelector("#musicList");
    if (!container) {
      console.error("❌ Không tìm thấy thẻ #musicList trong HTML");
      return;
    }

    if (!Array.isArray(playList) || playList.length === 0) {
      container.innerHTML = "<p>⚠️ Không có bài hát nào được tải!</p>";
      return;
    }

    container.innerHTML = playList.map(song => `
      <div class="song-item">
        <img src="${song.imgPath_200}" alt="${song.name}" class="song-img">
        <div class="song-info">
          <h4>${song.name}</h4>
          <p>${song.author}</p>
          <audio controls src="${song.musicPath}"></audio>
        </div>
      </div>
    `).join("");

    console.log("✅ Render danh sách hoàn tất");
  }, 500);
});
