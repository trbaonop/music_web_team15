document.addEventListener("DOMContentLoaded", () => {
  const settingsPanel = document.getElementById('settingsPanel');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const closeSettings = document.getElementById('closeSettings');
  const gearBtn = document.querySelector('.fa-gear');

  // Lưu và hiển thị trạng thái checkbox "tự động phát tiếp" (autoNext)
  const autoNextCheckbox = document.getElementById('autoNext');
  if (autoNextCheckbox) {
    const saved = localStorage.getItem('autoNext');
    if (saved !== null) {
      autoNextCheckbox.checked = saved === 'true';
    }

    autoNextCheckbox.addEventListener('change', () => {
      localStorage.setItem('autoNext', autoNextCheckbox.checked ? 'true' : 'false');
    });
  }

  // Lưu và hiển thị trạng thái phát ngẫu nhiên (shuffle)
  const shuffleCheckbox = document.getElementById('shuffleMode');
  if (shuffleCheckbox) {
    const savedShuffle = localStorage.getItem('shuffleMode');
    if (savedShuffle !== null) shuffleCheckbox.checked = savedShuffle === 'true';
    shuffleCheckbox.addEventListener('change', () => {
      localStorage.setItem('shuffleMode', shuffleCheckbox.checked ? 'true' : 'false');
    });
  }

  // Lưu và hiển thị trạng thái lặp lại bài (loop)
  const loopCheckbox = document.getElementById('loopMode');
  if (loopCheckbox) {
    const savedLoop = localStorage.getItem('loopMode');
    if (savedLoop !== null) loopCheckbox.checked = savedLoop === 'true';
    loopCheckbox.addEventListener('change', () => {
      localStorage.setItem('loopMode', loopCheckbox.checked ? 'true' : 'false');
    });
  }

  if (gearBtn) {
    gearBtn.addEventListener('click', () => {
      settingsPanel.classList.add('open');
      settingsOverlay.classList.add('show');
    });
  }

  if (closeSettings) {
    closeSettings.addEventListener('click', () => {
      settingsPanel.classList.remove('open');
      settingsOverlay.classList.remove('show');
    });
  }

  if (settingsOverlay) {
    settingsOverlay.addEventListener('click', () => {
      settingsPanel.classList.remove('open');
      settingsOverlay.classList.remove('show');
    });
  }
});




