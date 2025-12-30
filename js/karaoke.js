// js/karaoke.js
(() => {
  let overlay = null;
  let iframe = null;
  let sendSong = null;

  const initKaraoke = () => {
    const menuItem = document.getElementById('karaokeMenuItem');
    if (!menuItem) return false;

    console.log('Karaoke: TÌM THẤY NÚT → SẴN SÀNG');

    // Đảm bảo nút có thể click
    menuItem.style.cursor = 'pointer';
    menuItem.style.userSelect = 'none';

    const openKaraoke = () => {
      console.log('Karaoke: ĐANG MỞ OVERLAY...');

      // Xóa overlay cũ
      const old = document.getElementById('karaokeOverlay');
      if (old) old.remove();

      // TẠO OVERLAY VỚI CSS INLINE (ĐẢM BẢO HIỆN)
      overlay = document.createElement('div');
      overlay.id = 'karaokeOverlay';
      overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        width: 100vw !important; height: 100vh !important;
        background: rgba(0,0,0,0.95) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        backdrop-filter: blur(8px) !important;
      `;

      overlay.innerHTML = `
        <div style="
          position: relative;
          width: 90%; max-width: 700px;
          height: 80vh; background: #111;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
        ">
          <button id="closeKaraokeIframe" style="
            position: absolute; top: 12px; right: 12px; z-index: 10;
            background: rgba(0,0,0,0.7); color: #fff; border: none;
            width: 40px; height: 40px; border-radius: 50%;
            font-size: 1.4rem; cursor: pointer;
          ">×</button>
          <iframe id="karaokeIframe" src="./karaoke.html" 
            style="width:100%; height:100%; border:none;" 
            frameborder="0" allowfullscreen></iframe>
        </div>
      `;

      document.body.appendChild(overlay);
      console.log('Karaoke: ĐÃ TẠO OVERLAY THÀNH CÔNG');

      iframe = overlay.querySelector('#karaokeIframe');

      // Đóng overlay
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.id === 'closeKaraokeIframe') {
          console.log('Karaoke: Đang đóng...');
          overlay.remove();
          overlay = iframe = sendSong = null;
        }
      });

      // Khi iframe load
      iframe.onload = () => {
        console.log('Karaoke: IFRAME ĐÃ LOAD');
        if (sendSong) sendSong();
      };

      // Hàm gửi bài hát
      sendSong = () => {
        if (!iframe?.contentWindow) return;
        if (!window.currentSong) {
          console.log('Karaoke: Chưa có bài hát → chờ...');
          return;
        }
        const song = { name: window.currentSong.name, artist: window.currentSong.artist };
        console.log('Karaoke: GỬI BÀI HÁT →', song);
        iframe.contentWindow.postMessage({ type: 'PLAY_SONG', song }, '*');
      };

      window.karaokeSendSong = sendSong;

      // Nếu đã có bài hát → gửi ngay
      if (window.currentSong) setTimeout(sendSong, 300);
    };

    // Gắn sự kiện click
    menuItem.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openKaraoke();
    };

    return true;
  };

  // Tự động tìm nút
  const tryInit = () => {
    if (initKaraoke()) return true;
    console.log('Karaoke: Đang chờ #karaokeMenuItem...');
    return false;
  };

  // Thử ngay + observer
  if (!tryInit()) {
    const observer = new MutationObserver(() => {
      if (tryInit()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();