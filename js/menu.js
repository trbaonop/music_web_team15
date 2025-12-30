// menu.js
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector('[aria-label="Menu"]');
  const audio = document.getElementById('audioPlayer');
  const PLAYBACK_RATE_KEY = 'KEY_PLAYBACK_RATE';

  if (!menuBtn || !audio) return;

  // Tạo menu popup
  const menuPopup = document.createElement('div');
  menuPopup.className = 'menu-popup';
  menuPopup.setAttribute('aria-hidden', 'true');
  menuPopup.innerHTML = `
    <button class="menu-item" data-action="download">Tải nhạc về</button>
    <button class="menu-item" data-action="speed-0.5">0.5x</button>
    <button class="menu-item" data-action="speed-1.0">1.0x</button>
    <button class="menu-item" data-action="speed-1.5">1.5x</button>
    <button class="menu-item" data-action="speed-2.0">2.0x</button>
  `;
  document.body.appendChild(menuPopup);

  // Hiển thị/ẩn menu khi nhấp vào nút
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    // Lấy vị trí nút menu mỗi lần click
    const rect = menuBtn.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;

    // Đặt vị trí menu ngay dưới nút menu
    menuPopup.style.position = 'absolute';
    menuPopup.style.top = (rect.bottom + scrollY) + 'px';
    menuPopup.style.left = rect.left + 'px';
    menuPopup.style.right = 'auto';

    // Kiểm tra nếu menu vượt chiều cao cửa sổ, đẩy lên trên
    const popupHeight = menuPopup.offsetHeight || 200;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    if (spaceBelow < popupHeight) {
      menuPopup.style.top = (rect.top + scrollY - popupHeight - 10) + 'px';
    }

    // Hiển thị menu
    const show = !menuPopup.classList.contains('show');
    document.querySelectorAll('.menu-popup.show').forEach(el => el.classList.remove('show'));
    menuPopup.classList.toggle('show', show);
    menuPopup.setAttribute('aria-hidden', String(!show));
  });

  // Ẩn menu khi nhấp ra ngoài
  document.addEventListener('click', (e) => {
    if (menuPopup && !menuPopup.contains(e.target) && !menuBtn.contains(e.target)) {
      menuPopup.classList.remove('show');
      menuPopup.setAttribute('aria-hidden', 'true');
    }
  });

  // Xử lý hành động từ menu
  menuPopup.addEventListener('click', (e) => {
    const action = e.target.getAttribute('data-action');
    if (!action || !audio.src) return;

    switch (action) {
      case 'download':
        downloadMusic();
        break;
      case 'speed-0.5':
      case 'speed-1.0':
      case 'speed-1.5':
      case 'speed-2.0':
        setPlaybackRate(parseFloat(action.split('-')[1]));
        break;
    }

    // Ẩn menu sau khi chọn
    menuPopup.classList.remove('show');
    menuPopup.setAttribute('aria-hidden', 'true');
  });

  // Hàm tải nhạc về
  function downloadMusic() {
    if (!audio.src) return;
    const link = document.createElement('a');
    link.href = audio.src;
    link.download = `${window.currentSong?.name || 'song'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // tăng bộ đếm tải về cho bài hiện tại
    try{
      const id = window.currentSong?.id;
      if (id){
        const dl = JSON.parse(localStorage.getItem('songDownloadCount')||localStorage.getItem('songDownloads')||'{}');
        dl[id] = (dl[id]||0) + 1;
        localStorage.setItem('songDownloadCount', JSON.stringify(dl));
        try{ window.dispatchEvent(new CustomEvent('songCountsChanged',{detail:{id}})); }catch(e){}
      }
    }catch(e){}
  }

  // Hàm chỉnh tốc độ phát
  function setPlaybackRate(rate) {
    if (!audio) return;
    audio.playbackRate = rate;
    localStorage.setItem(PLAYBACK_RATE_KEY, String(rate));
    console.log(`Playback rate set to ${rate}x`);
  }

  // Khởi tạo tốc độ từ localStorage
  const savedRate = parseFloat(localStorage.getItem(PLAYBACK_RATE_KEY)) || 1.0;
  if (audio) audio.playbackRate = savedRate;
});

