document.addEventListener("DOMContentLoaded", () => {
  console.log("🎬 test.js chạy...");

  setTimeout(() => {
    const raw = localStorage.getItem("KEY_PLAY_LIST");

    let list = [];
    try {
      list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      console.error("❌ Parse KEY_PLAY_LIST lỗi:", e);
      list = [];
    }

    console.log("🎶 Dữ liệu render:", list);

    const container = document.querySelector("#musicList");
    if (!container) return console.error("❌ Không tìm thấy #musicList");

    if (!list.length) {
      container.innerHTML = "<p>⚠️ Không có bài hát nào</p>";
      return;
    }

    container.innerHTML = list.map(song => `
      <div class="song-item">
        <img src="${song.imgSong}" class="song-img" onerror="this.src='/data/imgs/default.jpg'">
        <div class="song-info">
          <h4>${song.name}</h4>
          <p>${song.author}</p>
          <audio controls src="${song.musicPath}"></audio>
        </div>
      </div>
    `).join("");

    console.log("✅ Render hoàn tất");
  }, 500);
});
