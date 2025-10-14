window.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("musicList");
  const player = document.getElementById("audioPlayer");

  const playList = JSON.parse(localStorage.getItem("KEY_PLAY_LIST")) || [];

  if (!playList.length) {
    list.innerHTML = "<li>Không có bài hát nào!</li>";
    return;
  }

  list.innerHTML = playList.map(song => `
    <li data-url="${song.musicPath}">
      <img src="${song.imgPath_70}" alt="${song.name}" width="70" height="70">
      <div class="song-info">
        <div class="song-name">${song.name}</div>
        <div class="song-author">${song.author}</div>
      </div>
      <span>▶️</span>
    </li>
  `).join("");

  list.addEventListener("click", e => {
    const li = e.target.closest("li");
    if (!li) return;
    player.src = li.dataset.url;
    player.play();
  });
});
