// ==================== YÊU THÍCH (FAVORITE SYSTEM) ====================

// Mảng lưu danh sách bài yêu thích (lưu trong localStorage)
let favoriteSongs = JSON.parse(localStorage.getItem('favoriteSongs')) || [];

// Khi player chọn bài hát mới
window.setCurrentSong = function(id, name, artist, thumb, url) {
  window.currentSong = { id, name, artist, thumb, url };
  updateHeartUI(id);
};

// Cập nhật trạng thái nút ❤️
function updateHeartUI(songId) {
  const btn = document.getElementById('favoriteBtn');
  if (!btn) return;

  const icon = btn.querySelector('i');
  const isFav = favoriteSongs.some(s => s.id === songId);

  icon.classList.toggle('fa-solid', isFav);
  icon.classList.toggle('fa-regular', !isFav);
  icon.style.color = isFav ? 'var(--heart-color, #e74c3c)' : 'inherit';
}

// ====== HIỂN THỊ DANH SÁCH YÊU THÍCH ======
function renderFavoriteList() {
  const list = document.getElementById('favoriteList');
  if (!list) return;

  // Xóa toàn bộ item cũ, giữ lại tiêu đề #favoriteTitle
  list.querySelectorAll('li:not(#favoriteTitle)').forEach(li => li.remove());

  if (favoriteSongs.length === 0) {
    const li = document.createElement('li');
    li.textContent = '';
    li.style.color = '#999';
    li.style.padding = '8px 12px';
    list.appendChild(li);
    return;
  }

  favoriteSongs.forEach(song => {
    const li = document.createElement('li');
    li.className = 'fav-item';
    li.dataset.id = song.id;
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.gap = '10px';
    li.style.padding = '6px 12px';
    li.style.cursor = 'pointer';

    li.innerHTML = `
      <img src="${song.thumb}" alt="${song.name}" class="fav-thumb" 
           style="width:40px;height:40px;border-radius:6px;object-fit:cover">
      <div class="fav-info" style="flex:1;overflow:hidden">
        <p style="margin:0;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${song.name}
        </p>
        <p style="margin:0;font-size:13px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${song.artist}
        </p>
      </div>
      <button class="remove-fav" title="Xóa khỏi yêu thích" 
              style="background:none;border:none;color:#e74c3c;cursor:pointer;">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;

    // Khi click vào li → phát bài hát đó
    li.addEventListener('click', (e) => {
      if (e.target.closest('.remove-fav')) return; // tránh xung đột nút xóa
      if (typeof window.playSongById === 'function') {
        window.playSongById(song.id);
      } else {
        const audio = document.getElementById('audioPlayer');
        if (audio) {
          audio.src = song.url;
          audio.play().catch(err => console.warn("Không phát được:", err));
        }
        const title = document.getElementById('player-title');
        const artist = document.getElementById('player-artist');
        const thumb = document.getElementById('player-thumb');
        if (title) title.textContent = song.name;
        if (artist) artist.textContent = song.artist;
        if (thumb) thumb.src = song.thumb;
        window.setCurrentSong(song.id, song.name, song.artist, song.thumb, song.url);
      }
    });

    // Khi nhấn nút xóa ❤️ khỏi danh sách
    li.querySelector('.remove-fav').addEventListener('click', (e) => {
      e.stopPropagation();
      favoriteSongs = favoriteSongs.filter(s => s.id !== song.id);
      localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
      renderFavoriteList();
      updateHeartUI(song.id);
    });

    list.appendChild(li);
  });
}

// ====== XỬ LÝ KHI ẤN ❤️ ======
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('favoriteBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const song = window.currentSong;
    if (!song) return;

    const idx = favoriteSongs.findIndex(s => s.id === song.id);

    if (idx >= 0) {
      // Nếu đã có → Bỏ khỏi danh sách
      favoriteSongs.splice(idx, 1);
    } else {
      // Nếu chưa có → Thêm vào danh sách
      favoriteSongs.push(song);
    }

    // Lưu lại và cập nhật UI
    localStorage.setItem('favoriteSongs', JSON.stringify(favoriteSongs));
    updateHeartUI(song.id);
    renderFavoriteList();
  });

  // Khi load lại trang → render danh sách
  renderFavoriteList();
});
