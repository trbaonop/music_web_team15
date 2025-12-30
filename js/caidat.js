document.addEventListener('DOMContentLoaded', () => {
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsOverlay = document.getElementById('settingsOverlay');

  const langItem = document.getElementById('langItem');
  const languageMenu = document.getElementById('languageSubmenu');
  const helpItem = document.getElementById('helpItem');
  const feedbackItem = document.getElementById('feedbackItem');

  const i18n = {
    vi: {
      favorites: ' Danh sách yêu thích',
      appName: '🎵 Cloudinary Music Player',
      language: 'Ngôn ngữ',
      song: ' 🎶 Bài hát',
      viOption: '🇻🇳 Tiếng Việt',
      enOption: '🇬🇧 English',
      help: 'Hướng dẫn và hỗ trợ',
      feedback: 'Góp ý',
      home: 'Trang chủ',
      explore: 'Khám phá',
      library: 'Thư viện',
      topChart: 'Bảng xếp hạng',
      playlist: 'Playlist',
      karaoke: 'Lời bài hát',
      
      searchPlaceholder: '🔍 Tìm kiếm bài hát, ca sĩ...',
      featuredArtists: '🎤 Ca sĩ nổi bật',
      loading: 'Đang tải danh sách...',
      noSong: 'Chưa phát bài nào',
      play: 'Phát',
      favorite: 'Yêu thích',
      shuffle: 'Phát ngẫu nhiên',
      prev: 'Quay lại',
      next: 'Tiếp theo',
      repeat: 'Lặp',
      queue: 'Queue',
      upNext: 'Up next',
      helpText: '📘 Hướng dẫn:\n- Nhấn play để nghe\n- Dùng Language để đổi ngôn ngữ\n- Dùng biểu tượng trái tim để yêu thích bài hát',
      feedbackPrompt: '💌 Gửi góp ý của bạn:',
      feedbackThanks: 'Cảm ơn góp ý của bạn!'
    },
    en: {
       favorites: ' Favorites',
      appName: '🎵 Cloudinary Music Player',
      language: 'Language',
      viOption: '🇻🇳 Vietnamese',
      enOption: '🇬🇧 English',
      help: 'Help & Support',
      feedback: 'Feedback',
      home: 'Home',
      explore: 'Explore',
      library: 'Library',
      topChart: 'Top Chart',
      playlist: 'Playlist',
      karaoke: 'Lyrics',
     
      searchPlaceholder: '🔍 Search song, artist...',
      featuredArtists: '🎤 Featured Artists',
      song:' 🎶 Song',
      loading: 'Loading songs...',
      noSong: 'No song playing',
      play: 'Play',
      favorite: 'Favorite',
      shuffle: 'Shuffle',
      prev: 'Previous',
      next: 'Next',
      repeat: 'Repeat',
      queue: 'Queue',
      upNext: 'Up next',
      helpText: '📘 Help:\n- Press play to listen\n- Use Language to switch language\n- Use heart icon to favorite songs',
      feedbackPrompt: '💌 Send your feedback:',
      feedbackThanks: 'Thank you for your feedback!'
    }
  };

 function updateLanguageUI(lang) {
  // Đổi text cho các span/data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (i18n[lang][key] !== undefined) {
      el.textContent = i18n[lang][key];
    }
  });

  // Placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (i18n[lang][key] !== undefined) el.placeholder = i18n[lang][key];
  });

  // Title / aria-label
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (i18n[lang][key] !== undefined) {
      el.title = i18n[lang][key];
      if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', i18n[lang][key]);
    }
  });

  // Cập nhật luôn danh sách yêu thích (hỗ trợ nhiều selector và giữ emoji nếu có)
  const favText = (i18n[lang].favorites || i18n[lang].favorite || 'Favorites').trim();
  const favSelectors = [
    '#favoriteTitle',
    '#favoriteTitle span',
    '[data-i18n="favorites"]',
    '[data-i18n="favorite"]',
    '.favorite-title',
    '.favorites-label'
  ];
  function applyFavTextTo(el) {
    const raw = (el.textContent || '').trim();
    const emojiMatch = raw.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u2600-\u26FF])+/u);
    const emoji = emojiMatch ? (emojiMatch[0] + ' ') : '';
    const newText = (emoji + favText).trim();
    if (el.textContent.trim() !== newText) {
      el.textContent = newText;
    }
    // lưu bản dịch vào data attr để tham chiếu sau này
    el.dataset.i18nFavorites = favText;
  }
  favSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => applyFavTextTo(el));
  });
}



  function closePanel() {
    settingsPanel?.classList.remove('active');
    settingsOverlay?.classList.remove('active');
    languageMenu?.classList.remove('active');
    const arrow = langItem?.querySelector('.arrow');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }

  // OPEN/CLOSE PANEL
  settingsBtn?.addEventListener('click', e => {
    e.stopPropagation();
    settingsPanel?.classList.toggle('active');
    settingsOverlay?.classList.toggle('active');
    const saved = localStorage.getItem('app_lang') || 'vi';
    updateLanguageUI(saved);
    languageMenu?.querySelectorAll('.language-option').forEach(o => {
      o.classList.toggle('active', o.dataset.lang === saved);
    });
  });

  settingsOverlay?.addEventListener('click', closePanel);
  settingsPanel?.addEventListener('click', e => e.stopPropagation());

  // Toggle language submenu
  langItem?.addEventListener('click', e => {
    e.stopPropagation();
    const active = languageMenu.classList.toggle('active');
    const arrow = langItem.querySelector('.arrow');
    if (arrow) arrow.style.transform = active ? 'rotate(90deg)' : 'rotate(0deg)';
  });

  // Select language
  languageMenu?.querySelectorAll('.language-option').forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      const lang = opt.dataset.lang;
      languageMenu.querySelectorAll('.language-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      localStorage.setItem('app_lang', lang);
      updateLanguageUI(lang);
      alert(lang === 'vi' ? 'Đã chuyển sang Tiếng Việt' : 'Switched to English');
      languageMenu.classList.remove('active');
      const arrow = langItem.querySelector('.arrow');
      if (arrow) arrow.style.transform = 'rotate(0deg)';
    });
  });

  // Help & Feedback
  helpItem?.addEventListener('click', e => {
    e.stopPropagation();
    const lang = localStorage.getItem('app_lang') || 'vi';
    alert(i18n[lang].helpText);
  });
  feedbackItem?.addEventListener('click', e => {
    e.stopPropagation();
    const lang = localStorage.getItem('app_lang') || 'vi';
    const msg = prompt(i18n[lang].feedbackPrompt);
    if (msg && msg.trim()) alert(i18n[lang].feedbackThanks);
  });

  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') closePanel(); });
  document.addEventListener('click', () => { if (settingsPanel?.classList.contains('active')) closePanel(); });

  // INIT
  const savedLang = localStorage.getItem('app_lang') || 'vi';
  updateLanguageUI(savedLang);

// MutationObserver để giữ "Danh sách yêu thích" luôn theo ngôn ngữ đã chọn
(function setupFavoriteObserver() {
  const favSelectors = [
    '#favoriteTitle',
    '#favoriteTitle span',
    '[data-i18n="favorites"]',
    '[data-i18n="favorite"]',
    '.favorite-title',
    '.favorites-label'
  ];
  function matchesFav(el) {
    if (!el || el.nodeType !== 1) return false;
    return favSelectors.some(sel => {
      try { return el.matches(sel); } catch { return false; }
    });
  }
  function findAffected(node) {
    if (node.nodeType === 1 && matchesFav(node)) return node;
    if (node.nodeType === 1) {
      for (const sel of favSelectors) {
        const found = node.querySelector(sel);
        if (found) return found;
      }
    }
    if (node.parentElement && matchesFav(node.parentElement)) return node.parentElement;
    return null;
  }

  const obs = new MutationObserver(mutations => {
    const lang = localStorage.getItem('app_lang') || 'vi';
    let need = false;
    const els = new Set();
    for (const m of mutations) {
      if (m.type === 'characterData') {
        const a = findAffected(m.target.parentElement);
        if (a) els.add(a);
      } else if (m.type === 'childList') {
        m.addedNodes.forEach(n => {
          const a = findAffected(n);
          if (a) els.add(a);
        });
        m.removedNodes.forEach(n => {
          // ignore
        });
      }
      if (els.size) need = true;
    }
    if (need) {
      // áp dụng lại văn bản chuẩn cho các selector
      const favText = (i18n[lang].favorites || i18n[lang].favorite || 'Favorites').trim();
      const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u2600-\u26FF])+/u;
      document.querySelectorAll(favSelectors.join(',')).forEach(el => {
        const raw = (el.textContent || '').trim();
        const emojiMatch = raw.match(emojiRegex);
        const emoji = emojiMatch ? (emojiMatch[0] + ' ') : '';
        const newText = (emoji + favText).trim();
        if (el.textContent.trim() !== newText) el.textContent = newText;
      });
    }
  });

  // Bắt đầu quan sát
  obs.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
  
});
