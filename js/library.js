// ===================== library.js – HOÀN CHỈNH 2025 =====================
// CÓ ĐỦ: Gần đây phát + Yêu thích nhất (Top Songs) + Nghệ sĩ yêu thích + Album

// ==================== HÀM HỖ TRỢ ====================
function getLocal(key, fallback = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.warn("Lỗi đọc localStorage:", key, e);
        return fallback;
    }
}

// ==================== 1. GẦN ĐÂY PHÁT ====================
function renderRecentSongs() {
    const container = document.getElementById("recentSongs");
    if (!container) return;

    const recent = getLocal("recentSongs", []);
    
    if (recent.length === 0) {
        container.innerHTML = `<li class="empty" style="text-align:center;padding:20px;color:#888;">Chưa phát bài nào</li>`;
        return;
    }

    container.innerHTML = recent.slice(0, 10).map(s => `
        <li class="song-item">
            <img src="${s.thumb || s.songThumb || './data/imgs/default.jpg'}" class="song-thumb" alt="${s.name}">
            <div class="song-info">
                <div class="song-name">${s.name}</div>
                <div class="song-artist">${s.artist || '—'}</div>
            </div>
        </li>
    `).join('');
}

// ==================== 2. YÊU THÍCH NHẤT (TOP SONGS) – BÀI HÁT NGHE NHIỀU NHẤT ====================
function renderTopSongs() {
    const container = document.getElementById("topSongs");
    if (!container) return;

    let allSongs = [];
    let playCount = {};

    try {
        const rawSongs = localStorage.getItem("allSongs");
        const rawCount = localStorage.getItem("songPlayCount");

        if (rawSongs) {
            const parsed = JSON.parse(rawSongs);
            allSongs = Array.isArray(parsed) ? parsed : [];
        }
        if (rawCount) {
            const parsed = JSON.parse(rawCount);
            playCount = typeof parsed === "object" && parsed !== null ? parsed : {};
        }
    } catch (e) {
        console.warn("Lỗi đọc dữ liệu Top Songs:", e);
    }

    if (allSongs.length === 0) {
        container.innerHTML = `<li style="text-align:center;padding:40px;color:#888;font-style:italic;">
            Chưa có bài hát nào được phát
        </li>`;
        return;
    }

    const songsWithPlays = allSongs
        .map(song => ({
            ...song,
            plays: playCount[song.id] || 0
        }))
        .filter(s => s.plays > 0)
        .sort((a, b) => b.plays - a.plays)
        .slice(0, 10);

    if (songsWithPlays.length === 0) {
        container.innerHTML = `<li style="text-align:center;padding:40px;color:#888;">
            Đang thu thập lượt nghe...<br>
            <small>Nghe vài bài là Top Songs sẽ hiện ngay!</small>
        </li>`;
        return;
    }

    const maxPlays = songsWithPlays[0].plays;
    container.innerHTML = songsWithPlays.map((s, i) => `
        <li class="top-item">
            <div class="rank">${i + 1}</div>
            <img src="${s.thumb || s.songThumb || './data/imgs/default.jpg'}" alt="${s.name}">
            <div class="song-info">
                <div class="title">${s.name}</div>
                <div class="artist">${s.artist || 'Không rõ'}</div>
            </div>
            <div class="plays">${s.plays.toLocaleString()} lượt</div>
            <div class="progress-bar">
                <div class="fill" style="width: ${(s.plays / maxPlays) * 100}%"></div>
            </div>
        </li>
    `).join('');
}

// ==================== 3. NGHỆ SĨ YÊU THÍCH (TÙY CHỌN) ====================
function renderFavoriteArtists() {
    const container = document.getElementById("favoriteArtists");
    if (!container) return;

    const artists = getLocal("FAVORITE_ARTISTS_LIST", []);
    container.innerHTML = artists.length === 0 
        ? `<div style="grid-column:1/-1;text-align:center;padding:60px;color:#aaa;">Chưa có nghệ sĩ yêu thích</div>`
        : artists.map(a => `
            <div class="artist-card">
                <img src="${a.avatar || './data/imgs/default-artist.jpg'}" onerror="this.src='./data/imgs/default-artist.jpg'">
                <p>${a.name}</p>
            </div>
        `).join('');
}

// ==================== 4. ALBUM GẦN ĐÂY (AN TOÀN) ====================
function renderRecentAlbums() {
    const container = document.getElementById("recentAlbums");
    if (!container) return;
    const albums = getLocal("recentAlbums", []);
    container.innerHTML = albums.length === 0 
        ? `<p style="text-align:center;padding:40px;color:#888;">Chưa có album</p>`
        : albums.map(a => `<div class="album-card"><img src="${a.img}"><p>${a.name}</p></div>`).join('');
}

// ==================== CHẠY KHI LOAD TRANG ====================
document.addEventListener("DOMContentLoaded", () => {
    renderRecentSongs();      // Gần đây phát → HIỆN LẠI NGAY
    renderTopSongs();         // Yêu thích nhất → chạy mượt, không lỗi
    renderFavoriteArtists();
    renderRecentAlbums();
});