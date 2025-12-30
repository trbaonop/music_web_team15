/*
  Consolidated main player:
  - Loads list from /api/music
  - Play/pause, prev/next, shuffle, loop, autoplay
  - Progress, volume, queue rendering
  - Integrates with yeuthich.js favorite module via window.toggleFavoriteCurrent / window.updateHeartUI
  - Theme toggling (light/dark)
  - Smart search and artist filtering
  - Ensures song and artist images are displayed correctly
*/
document.addEventListener("DOMContentLoaded", () => {
  // --- SELECTORS (an toàn) ---
  const audio = document.getElementById('audioPlayer');
  const listEl = document.getElementById('musicList');
  const playerThumb = document.getElementById('player-thumb');
  const playerTitle = document.getElementById('player-title');
  const playerArtist = document.getElementById('player-artist');
  const playBtn = document.getElementById('playBtn');
  const prevBtn = document.querySelector('.prev-btn') || document.getElementById('prevBtn');
  const nextBtn = document.querySelector('.next-btn') || document.getElementById('nextBtn');
  const shuffleBtn = document.querySelector('.shuffle-btn');
  const repeatBtn = document.querySelector('.repeat-btn');
  const progressBar = document.getElementById('progressBar');
  const timeFrom = document.getElementById('timeFrom') || document.getElementById('currentTime');
  const timeTo = document.getElementById('timeTo') || document.getElementById('totalTime');
  const queueBtn = document.querySelector('.queue-toggle') || document.getElementById('queueBtn');
  const queuePanel = document.getElementById('queuePanel');
  const queueList = document.getElementById('queueList');
  const bitrateBadge = document.querySelector('.bitrate-badge') || document.getElementById('bitrateBadge');
  const volumeBtn = document.querySelector('[aria-label="Volume"]') || document.getElementById('volumeBtn');
  const volumePopover = document.querySelector('.volume-popover') || document.getElementById('volumePopover');
  const searchInput = document.getElementById('searchInput');
  const artistList = document.getElementById('artistList');
  const toggleBtn = document.getElementById('themeToggle');
  const body = document.body;

  // Kiểm tra phần tử cần thiết
  if (!listEl) { console.warn("⚠️ #musicList không tồn tại trong DOM."); return; }
  if (!audio) console.warn("⚠️ #audioPlayer không tìm thấy.");
  if (!artistList) console.warn("⚠️ #artistList không tìm thấy.");

 let songs = [];
let originalSongs = [];
let currentIndex = -1;

// ==================== THÊM TỪ ĐÂY ====================
// HÀM LƯU TOÀN BỘ BÀI HÁT VÀO localStorage ĐỂ TOP SONGS HOẠT ĐỘNG
function saveAllSongsToStorage() {
    if (!Array.isArray(songs) || songs.length === 0) {
        console.warn("Chưa có bài hát để lưu vào allSongs");
        return;
    }

    const cleanSongs = songs.map((s, index) => ({
        id: String(s.id || s.songId || index), // bắt buộc có id (dùng index nếu không có)
        name: s.name || "Không tên",
        artist: s.artist || "Không rõ",
        thumb: s.thumb || s.songThumb || "./data/imgs/default.jpg",
        songThumb: s.songThumb || s.thumb || "./data/imgs/default.jpg",
        url: s.url || "#"
    }));

    localStorage.setItem("allSongs", JSON.stringify(cleanSongs));
    console.log("ĐÃ LƯU allSongs:", cleanSongs.length, "bài hát");
}

// TỰ ĐỘNG LƯU KHI MẢNG songs[] THAY ĐỔI (bất kể bạn load từ đâu: JSON, Cloudinary, fetch...)
const observer = new MutationObserver(() => {
    if (songs.length > 0) {
        saveAllSongsToStorage();
    }
});
// Theo dõi thay đổi mảng songs (rất thông minh!)
setInterval(() => {
    if (songs.length > 0 && !localStorage.getItem("allSongs")) {
        saveAllSongsToStorage();
    }
}, 2000);

// Gọi ngay lần đầu khi trang load xong (đề phòng)
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(saveAllSongsToStorage, 1500);
});
// ==================== ĐẾN ĐÂY ====================
  const VOL_KEY = 'KEY_VOL';
  const MUTED_KEY = 'KEY_MUTED';
  const SHUFFLE_KEY = 'KEY_SHUFFLE';
  const LOOP_KEY = 'loopMode';
  const AUTONEXT_KEY = 'autoNext';
  const DEFAULT_IMAGE = 'data/imgs/default.jpg';

  // ================= THEME =================
  function applyTheme(isLight) {
    if (!body) return;
    body.classList.toggle("light", isLight);
    if (toggleBtn) toggleBtn.textContent = isLight ? "☀️ Light" : "🌙 Dark";
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch (e) { /* ignore */ }
  }

  applyTheme(localStorage.getItem("theme") === "light");

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isLight = !body.classList.contains("light");
      applyTheme(isLight);
    });
  }

  // ================= UTILITY =================
  function fmtTime(t) {
    if (!isFinite(t) || isNaN(t)) return '00:00';
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
  }

  // ================= LOAD MUSIC =================
  async function loadMusic() {
    try {
      const res = await fetch('/api/music');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      console.log("API response:", data);

      songs = Array.isArray(data.songs) ? data.songs.map(s => {
        // Normalize image fields for both song and artist
        const songImg = (s.imgSong || s.thumb || s.image || '').trim() || DEFAULT_IMAGE;
        const artistImg = (s.imgSinger || s.thumb || s.image || '').trim() || DEFAULT_IMAGE;
        return {
          id: s.id || s.musicPath || s.name || '',
          url: s.musicPath || s.url || '',
          name: s.name || 'Không rõ',
          artist: s.author || s.artist || '',
          songThumb: songImg,
          artistThumb: artistImg
        };
      }) : [];
      originalSongs = songs.slice();
      console.log('Loaded songs:', songs);
      saveAllSongsToStorage();
      renderList();
      renderQueue();
      renderArtists();
    } catch (e) {
      console.error('Load music error', e);
      if (listEl) listEl.innerHTML = '<li>Không tải được danh sách</li>';
      if (artistList) artistList.innerHTML = '<p>Lỗi khi tải danh sách ca sĩ</p>';
    }
  }

  function renderList() {
    if (!listEl) return;
    if (!songs.length) { listEl.innerHTML = '<li>Không có bài hát</li>'; return; }
    const limitedSongs = songs.slice(0, 6);
    listEl.innerHTML = limitedSongs.map((s, i) => `
      <li class="song-item" data-idx="${i}" data-url="${s.url}" data-name="${escapeHtml(s.name)}" data-artist="${escapeHtml(s.artist)}" data-song-thumb="${s.songThumb}" data-artist-thumb="${s.artistThumb}">
        <img class="song-cover" src="${s.songThumb}" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'">
        <div class="song-info">
          <div class="song-name">${escapeHtml(s.name)}</div>
          <div class="song-author">
            <img class="singer-avatar" src="${s.artistThumb}" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'">
            <span>${escapeHtml(s.artist)}</span>
          </div>
        </div>
        <span class="play-icon">▶️</span>
      </li>
    `).join('');
  }

  function setCurrent(index) {
    if (!songs[index]) return;
    currentIndex = index;
    const s = songs[index];

    addToRecent(s); // thêm vào recent

    // Tăng lượt nghe + tự động cập nhật Top Songs
    countPlay(s.id, index);
    // ------------------------------------------------------

    window.currentSong = { id: s.id, name: s.name, artist: s.artist, songThumb: s.songThumb, artistThumb: s.artistThumb, url: s.url };
    window._currentSongId = s.id;
    if (audio) { audio.src = s.url; audio.dataset.index = String(index); audio.dataset.songId = s.id; }
    if (playerTitle) playerTitle.textContent = s.name;
    if (playerArtist) playerArtist.textContent = s.artist || '—';
    if (playerThumb) playerThumb.src = s.songThumb || DEFAULT_IMAGE;
    if (typeof window.karaokeSendSong === 'function') window.karaokeSendSong();

    if (typeof setCurrentSong === 'function') setCurrentSong(s.id, s.name, s.artist, s.songThumb, s.url);
    audio.play().then(() => updatePlayIcon(true)).catch(() => updatePlayIcon(false));
    document.querySelectorAll('.song-item').forEach(li => li.classList.toggle('playing', Number(li.dataset.idx) === index));
    highlightQueueIndex(index);
}





// ==================== TỰ ĐỘNG ĐẾM LƯỢT NGHE CHO TOP SONGS ====================
// Hàm này có thể gọi từ bất kỳ đâu: setCurrent, playNext, playPrev, v.v.
function countPlay(songId, songIndex = null) {
    if (!songId) return;

    try {
        // Lấy dữ liệu cũ
        const playCount = JSON.parse(localStorage.getItem('songPlayCount') || '{}');

        // Tăng lượt nghe
        playCount[songId] = (playCount[songId] || 0) + 1;

        // Lưu lại
        localStorage.setItem('songPlayCount', JSON.stringify(playCount));

        // Nếu đang có mảng songs[] và biết index → cập nhật luôn trong bộ nhớ (tùy chọn)
        if (songIndex !== null && songs && songs[songIndex]) {
            songs[songIndex].playCount = playCount[songId];
        }

        // Tự động cập nhật phần "Yêu thích nhất" trong Library nếu trang đang mở
        if (typeof renderTopSongs === 'function') {
            renderTopSongs();
        }

        console.log(`Đã tăng lượt nghe: ${songId} → ${playCount[songId]} lượt`);
    } catch (e) {
        console.warn('Lỗi lưu lượt nghe:', e);
    }
}




  function updatePlayIcon(isPlaying) {
    if (!playBtn) return;
    const ico = playBtn.querySelector('i');
    if (!ico) return;
    ico.classList.toggle('fa-pause', !!isPlaying);
    ico.classList.toggle('fa-play', !isPlaying);
    playBtn.classList.toggle('playing', !!isPlaying);
  }






  // ================= PLAYER CONTROLS =================
  playBtn?.addEventListener('click', async () => {
    if (!audio) return;
    if (!audio.src) {
      if (songs.length) { setCurrent(0); return; }
      return;
    }
    if (audio.paused) { await audio.play().catch(() => {}); updatePlayIcon(true); }
    else { audio.pause(); updatePlayIcon(false); }
  });

  listEl?.addEventListener('click', (e) => {
    const li = e.target.closest && e.target.closest('li.song-item');
    if (!li) return;
    const idx = Number(li.dataset.idx);
    if (!isNaN(idx)) setCurrent(idx);
  });

  function getSettings() {
    return {
      shuffle: shuffleBtn?.classList.contains('active') || false,
      loop: repeatBtn?.classList.contains('active') || false,
      autoNext: localStorage.getItem(AUTONEXT_KEY) === 'true'
    };
  }

  shuffleBtn?.addEventListener('click', () => {
    shuffleBtn.classList.toggle('active');
    localStorage.setItem(SHUFFLE_KEY, shuffleBtn.classList.contains('active'));
  });

  repeatBtn?.addEventListener('click', () => {
    repeatBtn.classList.toggle('active');
    localStorage.setItem(LOOP_KEY, repeatBtn.classList.contains('active'));
  });

  // ================= SHUFFLE & NAVIGATION =================
  const shuffleHistory = [];

  function getNextShuffleIndex() {
    if (!songs.length) return -1;
    const played = new Set(shuffleHistory);
    if (played.size >= songs.length) shuffleHistory.length = 0;
    const candidates = songs.map((_, i) => i).filter(i => i !== currentIndex && !played.has(i));
    if (candidates.length === 0) {
      let i;
      do { i = Math.floor(Math.random() * songs.length); } while (i === currentIndex && songs.length > 1);
      return i;
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function playNext() {
    if (!songs.length) return;
    const settings = getSettings();
    if (settings.loop && currentIndex >= 0) { setCurrent(currentIndex); return; }
    if (settings.shuffle) {
      const nextIdx = getNextShuffleIndex();
      if (nextIdx >= 0) setCurrent(nextIdx);
      return;
    }
    let next = (currentIndex >= 0) ? currentIndex + 1 : 0;
    if (next >= songs.length) next = 0;
    setCurrent(next);
  }

  function playPrev() {
    if (!songs.length) { if (audio && audio.currentTime > 3) audio.currentTime = 0; return; }
    const settings = getSettings();
    if (settings.loop && currentIndex >= 0) { setCurrent(currentIndex); return; }
    if (settings.shuffle) {
      if (shuffleHistory.length >= 2) {
        shuffleHistory.pop();
        const prev = shuffleHistory.pop();
        if (typeof prev === 'number') { setCurrent(prev); return; }
      }
      const r = Math.floor(Math.random() * songs.length);
      setCurrent(r);
      return;
    }
    let prev = (currentIndex > 0) ? currentIndex - 1 : songs.length - 1;
    setCurrent(prev);
  }

  prevBtn?.addEventListener('click', playPrev);
  nextBtn?.addEventListener('click', playNext);
  window.playNext = playNext;
  window.playPrev = playPrev;

  audio?.addEventListener('play', () => {
    const settings = getSettings();
    if (settings.shuffle && currentIndex >= 0) {
      if (shuffleHistory[shuffleHistory.length - 1] !== currentIndex) {
        shuffleHistory.push(currentIndex);
        if (shuffleHistory.length > songs.length) shuffleHistory.shift();
      }
    }
  });

  // ================= PROGRESS & TIME =================
  audio?.addEventListener('loadedmetadata', () => {
    if (timeTo) timeTo.textContent = fmtTime(audio.duration);
  });

  let isSeeking = false;
  progressBar?.addEventListener('input', (e) => {
    isSeeking = true;
    if (!audio.duration) return;
    const pct = Number(e.target.value);
    if (timeFrom) timeFrom.textContent = fmtTime((pct / 100) * audio.duration);
  });

  progressBar?.addEventListener('change', (e) => {
    isSeeking = false;
    if (!audio.duration) return;
    const pct = Number(e.target.value);
    audio.currentTime = (pct / 100) * audio.duration;
  });

  audio?.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    if (!isSeeking && progressBar) progressBar.value = (audio.currentTime / audio.duration) * 100;
    if (timeFrom) timeFrom.textContent = fmtTime(audio.currentTime);
  });

  audio?.addEventListener('ended', () => {
    const settings = getSettings();
    if (settings.loop) {
      audio.currentTime = 0;
      audio.play();
    } else if (settings.autoNext) {
      playNext();
    }
  });

  // ================= VOLUME =================
  let volSlider = document.querySelector('#volumeSlider');
  let muteToggleBtn = null;
  let volumePopoverEl = volumePopover;

  if (!volumePopoverEl) {
    volumePopoverEl = document.createElement('div');
    volumePopoverEl.className = 'volume-popover';
    volumePopoverEl.setAttribute('aria-hidden', 'true');
    volumePopoverEl.innerHTML = `
      <input id="volumeSlider" type="range" min="0" max="1" step="0.01" style="width:120px;display:block;margin-bottom:8px" />
      <button id="muteToggle" class="icon-btn" title="Bật/Tắt âm">Mute</button>
    `;
    document.body.appendChild(volumePopoverEl);
  }
  volSlider = document.querySelector('#volumeSlider');
  muteToggleBtn = document.querySelector('#muteToggle');

  const savedVol = parseFloat(localStorage.getItem(VOL_KEY));
  audio.volume = !isNaN(savedVol) ? savedVol : (audio.volume ?? 1);
  audio.muted = localStorage.getItem(MUTED_KEY) === 'true' || false;
  if (volSlider) volSlider.value = String(audio.volume);

  function updateVolumeUi() {
    const ico = volumeBtn?.querySelector('i');
    if (!ico) return;
    if (audio.muted || audio.volume === 0) ico.className = 'fa-solid fa-volume-xmark';
    else if (audio.volume < 0.5) ico.className = 'fa-solid fa-volume-low';
    else ico.className = 'fa-solid fa-volume-high';
  }
  updateVolumeUi();

  volSlider?.addEventListener('input', (e) => {
    const v = Number(e.target.value);
    audio.volume = v;
    audio.muted = false;
    localStorage.setItem(VOL_KEY, String(v));
    localStorage.setItem(MUTED_KEY, 'false');
    updateVolumeUi();
  });

  muteToggleBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    audio.muted = !audio.muted;
    localStorage.setItem(MUTED_KEY, String(audio.muted));
    updateVolumeUi();
  });

  volumeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!volumePopoverEl) return;
    const rect = volumeBtn.getBoundingClientRect();
    volumePopoverEl.style.position = 'fixed';
    volumePopoverEl.style.right = (window.innerWidth - rect.right) + 'px';
    volumePopoverEl.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
    const show = !volumePopoverEl.classList.contains('show');
    document.querySelectorAll('.volume-popover.show').forEach(el => el.classList.remove('show'));
    volumePopoverEl.classList.toggle('show', show);
    volumePopoverEl.setAttribute('aria-hidden', String(!show));
    volSlider && (volSlider.value = String(audio.volume));
  });

  document.addEventListener('click', (ev) => {
    if (volumePopoverEl && !volumePopoverEl.contains(ev.target) && !volumeBtn?.contains(ev.target)) {
      volumePopoverEl.classList.remove('show');
      volumePopoverEl.setAttribute('aria-hidden', 'true');
    }
  });

  // // ================= QUEUE =================
  function renderQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';
    if (!songs.length) { queueList.innerHTML = '<li style="color:#999;padding:12px">Không có bài nào</li>'; return; }
    songs.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'queue-item';
      li.dataset.index = String(i);
      li.innerHTML = `
        <img src="${s.songThumb}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'">
        <div class="queue-meta">
          <div class="title">${escapeHtml(s.name)}</div>
          <div class="artist">${escapeHtml(s.artist)}</div>
        </div>
        <div class="queue-item-actions">
          <button class="icon-btn play-from-queue" data-idx="${i}" title="Phát"><i class="fa-solid fa-play"></i></button>
          <button class="icon-btn remove-from-queue" data-idx="${i}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;
      queueList.appendChild(li);
    });
    queueList.querySelectorAll('.play-from-queue').forEach(b => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const idx = Number(b.dataset.idx); if (!isNaN(idx)) setCurrent(idx);
    }));
    queueList.querySelectorAll('.remove-from-queue').forEach(b => b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const idx = Number(b.dataset.idx);
      if (isNaN(idx)) return;
      songs.splice(idx, 1);
      renderList();
      renderQueue();
      if (currentIndex === idx) { currentIndex = -1; audio.pause(); updatePlayIcon(false); }
    }));
    queueList.querySelectorAll('.queue-item').forEach(li => li.addEventListener('click', () => {
      const idx = Number(li.dataset.index); if (!isNaN(idx)) setCurrent(idx);
    }));
  }

  queueBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!queuePanel) return;
    const show = queuePanel.getAttribute('aria-hidden') === 'true';
    if (show) {
  renderQueue();
  queuePanel.setAttribute('aria-hidden', 'false');
  queuePanel.classList.add('show');

  // ✅ Lấy đúng vị trí nút Queue
  if (queueBtn) {
    const rect = queueBtn.getBoundingClientRect();
    queuePanel.style.position = 'fixed';
    queuePanel.style.right = (window.innerWidth - rect.right) + 'px';
    queuePanel.style.bottom = (window.innerHeight - rect.top - 20) + 'px';
  } else {
    queuePanel.style.right = '100px';
    queuePanel.style.bottom = '70px';
  }
}
else {
      queuePanel.setAttribute('aria-hidden', 'true');
      queuePanel.classList.remove('show');
    }
  });

  window.addEventListener('resize', () => {
    if (!queuePanel || queuePanel.getAttribute('aria-hidden') === 'true') return;
    const playerControls = document.querySelector('.player-controls');
    if (playerControls) {
      
      if (queueBtn) {
        const queueBtnRect = queueBtn.getBoundingClientRect();
        queuePanel.style.right = (window.innerWidth - queueBtnRect.right) + 'px';
      }
    }
  });

  function highlightQueueIndex(idx) {
    document.querySelectorAll('#queueList li').forEach(li => li.classList.toggle('playing', Number(li.dataset.index) === idx));
  }




  

  // ================= ARTIST FILTERING =================
  function renderArtists() {
    if (!artistList) return;
    const map = new Map();
    originalSongs.forEach((s, i) => {
      const name = (s.artist || 'Unknown').trim();
      if (!map.has(name)) map.set(name, { name, thumb: s.artistThumb, count: 0, firstIdx: i });
      const entry = map.get(name);
      entry.count++;
    });

    artistList.innerHTML = '';
    if (!map.size) { artistList.innerHTML = '<div class="no-artists">Không có ca sĩ</div>'; return; }

    map.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'artist-card';
      card.innerHTML = `
        <img src="${item.thumb || DEFAULT_IMAGE}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE}'">
        <div class="artist-meta">
          <div class="artist-name">${escapeHtml(item.name)}</div>
          <div class="artist-count">${item.count} bài</div>
        </div>
      `;
      card.addEventListener('click', () => {
        songs = originalSongs.filter(s => (s.artist || '').trim() === item.name);
        currentIndex = -1;
        renderList();
        renderQueue();
        if (songs.length) setCurrent(0);
        const clearBtn = document.querySelector('.artist-clear-btn');
        if (!clearBtn) {
          const b = document.createElement('button');
          b.className = 'artist-clear-btn';
          b.textContent = 'Hiển thị tất cả';
          b.addEventListener('click', () => {
            songs = originalSongs.slice();
            renderList();
            renderQueue();
            b.remove();
          });
          artistList.prepend(b);
        }
      });
      artistList.appendChild(card);
    });
  }

  // ================= SMART SEARCH =================
  let searchTimeout = null;

// Chuẩn hóa chuỗi để tìm kiếm
function normalizeSearch(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Hiển thị suggestions ngay dưới thanh tìm kiếm
const suggestionsBox = document.getElementById('suggestions');

function renderSuggestions(query) {
  suggestionsBox.innerHTML = '';

  if (!query) {
    suggestionsBox.style.display = 'none';
    return;
  }

  const q = normalizeSearch(query);
  const words = q.split(" ").filter(w => w.length > 0);

  const filtered = originalSongs.filter(song => {
    const name = normalizeSearch(song.name || "");
    const artist = normalizeSearch(song.artist || "");
    return words.every(word => name.includes(word) || artist.includes(word));
  });

  filtered.forEach(song => {
    const div = document.createElement('div');
    div.classList.add('suggestion-item');
    div.innerHTML = `
      <img src="${song.cover || 'default_cover.jpg'}" alt="${song.name}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:10px;">
      <div>
        <strong>${song.name}</strong><br>
        <small>${song.artist}</small>
      </div>
    `;
    div.addEventListener('click', () => {
      searchInput.value = song.name;
      suggestionsBox.style.display = 'none';
      // Cập nhật danh sách bài hát
      songs = [song];
      renderList();
      renderQueue();
      renderArtists();
    });
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = filtered.length ? 'block' : 'none';
}

// Sửa event listener input
searchInput?.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  searchTimeout = setTimeout(() => {
    filterSongs(query);       // lọc bài hát
    renderSuggestions(query); // hiển thị gợi ý ngay dưới ô search
  }, 300);
});

searchInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    filterSongs(query);
    renderSuggestions(query);
  }
});

  // ================= INITIALIZATION =================
loadMusic().then(() => {
  // --- MỚI: load playCount từ localStorage ---
  try {
    const stored = JSON.parse(localStorage.getItem('songPlayCount') || '{}');
    songs = songs.map(s => ({ ...s, playCount: stored[s.id] || 0 }));
  } catch(e) {
    console.log('Lỗi load playCount:', e);
  }

  if (typeof renderTopSongs === 'function') renderTopSongs(); // hiển thị top 10 bài yêu thích
});

if (audio && audio.src) {
  document.querySelectorAll('.song-item').forEach(li => li.classList.remove('playing'));
}

if (localStorage.getItem(SHUFFLE_KEY) === 'true') {
  shuffleBtn?.classList.add('active');
}
if (localStorage.getItem(LOOP_KEY) === 'true') {
  repeatBtn?.classList.add('active');
}
});









function addToRecent(song) {
    try {
        let list = JSON.parse(localStorage.getItem("recentSongs") || "[]");

        // xóa bài trùng
        list = list.filter(s => s.id !== song.id);

        // thêm bài mới lên đầu
        list.unshift({
            id: song.id,
            name: song.name,
            artist: song.artist,
            thumb: song.songThumb,
            url: song.url
        });

        // giới hạn 20 bài
        list = list.slice(0, 5);

        localStorage.setItem("recentSongs", JSON.stringify(list));
    } catch (e) {
        console.log("Lỗi lưu recent:", e);
    }
}
