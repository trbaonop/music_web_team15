// explore.js
// Gọi API /api/music và hiển thị nội dung

const selectors = {
  artists: document.getElementById("artists"),
  popular: document.getElementById("popular"),
  random: document.getElementById("random"),
  player: document.getElementById("player"),
  playerCover: document.getElementById("player-cover"),
  playerTitle: document.getElementById("player-title"),
  playerArtist: document.getElementById("player-artist")
};

async function fetchMusic() {
  try {
    const res = await fetch("/api/music");
    const json = await res.json();
    if (!json || json.success !== true) {
      throw new Error("API trả về thất bại hoặc không đúng định dạng");
    }
    return json;
  } catch (err) {
    console.error("Lỗi khi gọi /api/music:", err);
    return { success: false, songs: [], artists: [] };
  }
}

function safeUrl(url) {
  // nếu url rỗng -> default image path
  if (!url) return "/data/imgs/default.jpg";
  return url;
}

function renderArtists(artists) {
  if (!artists || !artists.length) {
    selectors.artists.innerHTML = "<div>Không có nghệ sĩ</div>";
    return;
  }
  selectors.artists.innerHTML = artists.map(a => {
    const img = safeUrl(a.imgSinger);
    const name = a.name || "unknown";
    return `
      <div class="artist-card" data-name="${escapeHtml(name)}">
        <img src="${img}" alt="${escapeHtml(name)}" loading="lazy"/>
        <div class="artist-name">${escapeHtml(name)}</div>
      </div>
    `;
  }).join("");

  // attach click: lọc bài theo nghệ sĩ
  document.querySelectorAll(".artist-card").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.getAttribute("data-name");
      // nếu click all -> show all songs
      if (name === "all") {
        loadAndRender(); // re-fetch and render
      } else {
        filterByArtist(name);
      }
      // scroll lên phần bài hát
      document.getElementById("popular-section").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function renderSongCard(song) {
  const cover = safeUrl(song.imgSong || song.imgSinger);
  const title = song.name || song.rawName || "Unknown";
  const author = song.author || "Không rõ";

  return `
    <div class="song-card" data-id="${song.id}" data-music="${escapeHtml(song.musicPath || "")}" data-title="${escapeHtml(title)}" data-artist="${escapeHtml(author)}" data-cover="${escapeHtml(cover)}">
      <img class="song-cover" src="${cover}" alt="${escapeHtml(title)}" loading="lazy" />
      <div class="song-info">
        <div class="song-title">${escapeHtml(title)}</div>
        <div class="song-artist">${escapeHtml(author)}</div>
      </div>
      <div>
        <button class="play-btn" title="Phát">▶ Play</button>
      </div>
    </div>
  `;
}

function renderSongs(targetEl, songs) {
  const container = document.getElementById(targetEl);
  if (!songs || songs.length === 0) {
    container.innerHTML = "<div>Không có bài hát</div>";
    return;
  }
  container.innerHTML = songs.map(renderSongCard).join("");
  // attach play events
  container.querySelectorAll(".play-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".song-card");
      const url = card.dataset.music;
      const title = card.dataset.title;
      const artist = card.dataset.artist;
      const cover = card.dataset.cover;
      playSong({ url, title, artist, cover });
    });
  });
}

function playSong({ url, title, artist, cover }) {
  if (!url) {
    alert("Không có đường dẫn bài hát để phát.");
    return;
  }
  selectors.player.src = url;
  selectors.playerCover.src = cover || "/data/imgs/default.jpg";
  selectors.playerTitle.textContent = title || "Unknown";
  selectors.playerArtist.textContent = artist || "";
  selectors.player.play().catch(err => {
    console.warn("Không thể tự động play (chặn trình duyệt):", err);
  });
}

/* filter theo nghệ sĩ */
function filterByArtist(artistName) {
  // lấy danh sách trong popular và random (từ DOM)
  const allCards = [...document.querySelectorAll(".song-card")];
  const filtered = allCards
    .map(c => ({
      html: c.outerHTML,
      author: c.dataset.artist || ""
    }))
    .filter(x => (x.author || "").toLowerCase().includes(artistName.toLowerCase()))
    .map(x => x.html);

  // hiển thị kết quả ở popular (ghi đè)
  const popularEl = document.getElementById("popular");
  popularEl.innerHTML = filtered.length ? filtered.join("") : `<div>Không tìm thấy bài cho ${escapeHtml(artistName)}</div>`;

  // re-attach play events for replaced content
  popularEl.querySelectorAll(".play-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".song-card");
      const url = card.dataset.music;
      const title = card.dataset.title;
      const artist = card.dataset.artist;
      const cover = card.dataset.cover;
      playSong({ url, title, artist, cover });
    });
  });
}

/* escape simple html to avoid injection */
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* main load */
async function loadAndRender() {
  selectors.popular.innerHTML = "Đang tải...";
  selectors.random.innerHTML = "Đang tải...";
  selectors.artists.innerHTML = "Đang tải...";

  const data = await fetchMusic();
  if (!data || data.success !== true) {
    selectors.popular.innerHTML = "<div>Lỗi tải dữ liệu</div>";
    selectors.random.innerHTML = "<div>Lỗi tải dữ liệu</div>";
    selectors.artists.innerHTML = "<div>Lỗi tải dữ liệu</div>";
    return;
  }

  const songs = Array.isArray(data.songs) ? data.songs : [];
  const artists = Array.isArray(data.artists) ? data.artists : [];

  // popular: chọn top 8 (nếu có)
  const popular = songs.slice(0, 8);
  // random: lấy 8 ngẫu nhiên
  const random = shuffleArray(songs).slice(0, 8);

  renderArtists(artists);
  renderSongs("popular", popular);
  renderSongs("random", random);
}

/* util shuffle */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random()* (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* init */
document.addEventListener("DOMContentLoaded", () => {
  loadAndRender();
});
