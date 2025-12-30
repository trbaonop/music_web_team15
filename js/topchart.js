//TopChart page script
(function(){
  const audio = document.getElementById('tc-audio');
  const chartBody = document.getElementById('chartBody');
  const chartCover = document.getElementById('chartCover');
  const chartCount = document.getElementById('chartCount');
  const chartDate = document.getElementById('chartDate');
  const chartTitle = document.getElementById('chartTitle');
  const chartPlay = document.getElementById('chartPlay');
  const globalPlayBtn = document.getElementById('globalPlayBtn');
  const globalTrackTitle = document.getElementById('globalTrackTitle');

  function fmtDuration(sec){
    if (!sec || isNaN(sec)) return '—';
    const m = Math.floor(sec/60).toString().padStart(2,'0');
    const s = Math.floor(sec%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  // state for loaded songs and selected metric view
  let loadedSongs = [];
  let selectedMetric = localStorage.getItem('tcSortMetric') || 'playCount';

  async function loadSongs(){
    // Prefer localStorage 'allSongs' if present (main.js saves it). Otherwise try fetch /api/music.
    let list = [];
    try{
      const raw = localStorage.getItem('allSongs');
      if (raw) list = JSON.parse(raw);
    }catch(e){ console.warn('parse allSongs',e) }

    if (!list || !list.length){
      try{
        const res = await fetch('/api/music');
        if (res.ok){
          const data = await res.json();
          list = Array.isArray(data.songs) ? data.songs.map(s=>({
            id: s.id || s.musicPath || s.name,
            name: s.name || '',
            artist: s.author || s.artist || '',
            thumb: s.imgSong || s.songThumb || s.thumb || './data/imgs/default.jpg',
            url: s.musicPath || s.url || '#',
            duration: s.duration || 0
          })) : [];
        }
      }catch(e){ console.warn('fetch /api/music', e) }
    }

    loadedSongs = list;
    return list;
  }

  function getPlayCounts(){
    try{ return JSON.parse(localStorage.getItem('songPlayCount')||'{}') }catch(e){return{}}
  }

  function getLikeCounts(){
    try{ return JSON.parse(localStorage.getItem('songLikeCount')||localStorage.getItem('songLikes')||'{}') }catch(e){return{}}
  }

  function getFavoriteSet(){
    try{
      const fav = JSON.parse(localStorage.getItem('favoriteSongs')||'[]');
      const s = new Set();
      if (Array.isArray(fav)) fav.forEach(i=>{ if (i && i.id) s.add(String(i.id)); });
      return s;
    }catch(e){ return new Set(); }
  }

  function getDownloadCounts(){
    try{ return JSON.parse(localStorage.getItem('songDownloadCount')||localStorage.getItem('songDownloads')||'{}') }catch(e){return{}}
  }

  function renderTable(songs, metric){
    const counts = getPlayCounts();
    const likes = getLikeCounts();
    const favSet = getFavoriteSet();
    const downloads = getDownloadCounts();
    const metricToUse = metric || localStorage.getItem('tcSortMetric') || selectedMetric || 'playCount';
    // attach playCount, likeCount, downloadCount and fallback duration
    const rows = songs.map((s,idx)=>({
      rank: idx+1,
      id: s.id || s.name || idx,
      name: s.name || 'Không tên',
      artist: s.artist || '—',
      thumb: s.thumb || './data/imgs/default.jpg',
      url: s.url || '#',
      duration: s.duration || 0,
      playCount: counts[s.id]||s.playCount||0,
      // prefer explicit counter mapping; fallback to any favorite present (show 1) or provided s.likeCount
      likeCount: (typeof likes[s.id] !== 'undefined' ? likes[s.id] : (s.likeCount || (favSet.has(String(s.id)) ? 1 : 0))),
      downloadCount: downloads[s.id]||s.downloadCount||0
    }));

    // Determine current sort metric and map to row field names
    const metricMap = { playCount: 'playCount', likes: 'likeCount', downloads: 'downloadCount' };
    const metricField = metricMap[metricToUse] || 'playCount';
    // sort by selected metric desc then fallback to playCount
    rows.sort((a,b)=> (b[metricField]||0) - (a[metricField]||0) || (b.playCount||0) - (a.playCount||0));
    const top = rows.slice(0,50);

    chartCount.textContent = top.length;
    chartDate.textContent = new Date().toLocaleDateString();

    const cachedDurations = getDurationCache();
    // expose current top list for global controls / auto-next
    currentList = top;

    chartBody.innerHTML = top.map((r, idx)=>{
      const cached = cachedDurations[r.id] || 0;
      const dur = (r.duration && r.duration>0) ? r.duration : cached;
      const loading = (!dur || dur === 0) ? ' loading' : '';
      const durText = (dur && dur>0) ? fmtDuration(dur) : '—';
      return `<tr data-id="${r.id}" data-url="${r.url}" data-index="${idx}">
        <td class="col-num">${r.rank}</td>
        <td class="col-title">
          <div class="title-row">
            <img class="track-thumb" src="${r.thumb}" onerror="this.onerror=null;this.src='./data/imgs/default.jpg'" />
            <div>
              <div class="track-title">${escapeHtml(r.name)}</div>
              <div class="track-artist">${escapeHtml(r.artist)}</div>
            </div>
          </div>
        </td>
        <td class="col-artist">${escapeHtml(r.artist)}</td>
        <td class="col-stats">${Number(r.likeCount||0).toLocaleString()}</td>
        <td class="col-stats">${Number(r.downloadCount||0).toLocaleString()}</td>
        <td class="col-duration play-cell">
          <div class="play-btn-row">
            <button class="play-icon-btn" data-url="${r.url}" data-index="${idx}" title="Play"><i class="fa-solid fa-play"></i></button>
            <span class="duration${loading}">${durText}</span>
          </div>
        </td>
      </tr>`;
    }).join('');

    // set cover first item's thumb if available
    if (top[0] && top[0].thumb) chartCover.src = top[0].thumb;

    // attach play handlers
    chartBody.querySelectorAll('.play-icon-btn').forEach(btn=>{
      btn.addEventListener('click',(e)=>{
        e.stopPropagation();
        const url = btn.dataset.url;
        const idx = Number(btn.dataset.index);
        if (!url || url === '#') return alert('Audio không có URL');
        playUrl(url, btn, idx);
      });
    });

    // clicking row will play the track url attribute (use row's play button if present)
    chartBody.querySelectorAll('tr[data-url]').forEach(tr=>{
      tr.addEventListener('click',()=>{
        const url = tr.dataset.url; if (!url || url==='#') return;
        const idx = Number(tr.dataset.index);
        const btn = tr.querySelector('.play-icon-btn');
        playUrl(url, btn, idx);
      });
    });

    // attempt to load missing durations (async) and update cells
    try{ loadMissingDurations(top); }catch(e){}
    // update header totals
    try{
      const totalPlays = top.reduce((s,i)=>s + Number(i.playCount||0),0);
      const totalLikes = top.reduce((s,i)=>s + Number(i.likeCount||0),0);
      const totalDownloads = top.reduce((s,i)=>s + Number(i.downloadCount||0),0);
      document.getElementById('chartTotalPlays').textContent = Number(totalPlays).toLocaleString();
      document.getElementById('chartTotalLikes').textContent = Number(totalLikes).toLocaleString();
      document.getElementById('chartTotalDownloads').textContent = Number(totalDownloads).toLocaleString();
    }catch(e){}
  }

  function setMetric(m){
    selectedMetric = m || 'playCount';
    try{ localStorage.setItem('tcSortMetric', selectedMetric); }catch(e){}
    // update active class on buttons
    document.querySelectorAll('.metric-btn').forEach(b=>{ b.classList.toggle('active', b.dataset.metric === selectedMetric); });
    if (Array.isArray(loadedSongs) && loadedSongs.length) renderTable(loadedSongs, selectedMetric);
  }

  // --- Duration metadata loader + cache ---
  function loadMissingDurations(rows){
    // rows: array of row objects (with id,url,duration)
    const cached = getDurationCache();
    const updates = {};
    rows.forEach((r, idx)=>{
      if ((r.duration && r.duration>0) || !r.url || r.url==='#') return;
      // if cached, update immediately
      if (cached[r.id]){
        r.duration = cached[r.id];
        const tr = chartBody.querySelector(`tr[data-id="${CSS.escape(r.id)}"]`);
        if (tr){ const span = tr.querySelector('.duration'); if (span) span.textContent = fmtDuration(r.duration); }
        return;
      }
      // try load metadata
      const a = new Audio();
      a.preload = 'metadata';
      a.src = r.url;
      a.addEventListener('loadedmetadata', ()=>{
        const d = Math.floor(a.duration) || 0;
        r.duration = d;
        updates[r.id] = d;
        const tr = chartBody.querySelector(`tr[data-id="${CSS.escape(r.id)}"]`);
        if (tr){ const span = tr.querySelector('.duration'); if (span) span.textContent = fmtDuration(d); }
        try{ a.src = ''; }catch(e){}
        saveDurationCache(updates);
      });
      
      // ensure we remove loading indicator when duration set
      a.addEventListener('loadedmetadata', ()=>{
        const tr = chartBody.querySelector(`tr[data-id="${CSS.escape(r.id)}"]`);
        if (tr){ const span = tr.querySelector('.duration'); if (span){ span.classList.remove('loading'); span.textContent = fmtDuration(Math.floor(a.duration)||0); } }
      });
      a.addEventListener('error', ()=>{
        try{ a.src = ''; }catch(e){}
      });
      // fallback: if metadata doesn't arrive in ~7s, remove loading indicator
      setTimeout(()=>{
        const tr = chartBody.querySelector(`tr[data-id="${CSS.escape(r.id)}"]`);
        if (tr){ const span = tr.querySelector('.duration'); if (span && span.classList.contains('loading')){ span.classList.remove('loading'); span.textContent = '—'; } }
      }, 7000);
    });
  }

  function getDurationCache(){
    try{ return JSON.parse(localStorage.getItem('songDurations')||'{}') }catch(e){ return {} }
  }
  function saveDurationCache(map){
    if (!map || typeof map !== 'object') return;
    const existing = getDurationCache();
    const merged = Object.assign({}, existing, map);
    try{ localStorage.setItem('songDurations', JSON.stringify(merged)) }catch(e){}
  }

  function playUrl(url, btn){
    // optional idx passed via btn.dataset.index handled by caller
    if (!audio) return;
    // resolve absolute URL for reliable comparison
    let resolvedUrl = url;
    try{ resolvedUrl = new URL(url, location.href).href }catch(e){ /* keep as-is */ }

    // toggle: if same track and currently playing -> pause
    if (currentPlayingUrl === resolvedUrl && !audio.paused){
      audio.pause();
      return;
    }

    // if same track and paused -> resume
    if (currentPlayingUrl === resolvedUrl && audio.paused){
      audio.play().catch(()=>{});
      // update icon
      document.querySelectorAll('.play-icon-btn i').forEach(i=>i.className='fa-solid fa-play');
      if (btn) { const ic = btn.querySelector('i'); if (ic) ic.className='fa-solid fa-pause'; currentPlayBtn = btn; }
      return;
    }

    // new track: set src and play
    // determine and set currentIndex if provided by btn
    if (btn && btn.dataset && typeof btn.dataset.index !== 'undefined'){
      currentIndex = Number(btn.dataset.index);
    }
    audio.src = url;
    currentPlayingUrl = resolvedUrl;
    currentPlayBtn = btn || null;
    // update global title
    try{ if (typeof currentIndex === 'number' && currentList[currentIndex]){
      globalTrackTitle.textContent = currentList[currentIndex].name || '—';
      // expose currentSong for other modules
      try{ window.setCurrentSong && window.setCurrentSong(currentList[currentIndex].id, currentList[currentIndex].name, currentList[currentIndex].artist, currentList[currentIndex].thumb, currentList[currentIndex].url); }catch(e){}
      window.currentSong = { id: currentList[currentIndex].id, name: currentList[currentIndex].name, artist: currentList[currentIndex].artist, thumb: currentList[currentIndex].thumb, url: currentList[currentIndex].url };
    } }catch(e){}
    audio.play().catch(()=>{});
    // update icons: reset all to play, then set current to pause
    document.querySelectorAll('.play-icon-btn i').forEach(i=>i.className='fa-solid fa-play');
    if (currentPlayBtn){ const ic = currentPlayBtn.querySelector('i'); if (ic) ic.className='fa-solid fa-pause'; }
    // update header/global button to pause icon
    if (globalPlayBtn){ const gi = globalPlayBtn.querySelector('i'); if (gi) gi.className='fa-solid fa-pause'; }
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]) }

  // initialize
  loadSongs().then(list=>{
    if (!list || !list.length){
      chartBody.innerHTML = '<tr><td colspan="6" style="color:#999;padding:18px">Không tìm thấy bài hát để hiển thị.</td></tr>';
    } else {
      renderTable(list, selectedMetric);
      // wire metric buttons
      document.querySelectorAll('.metric-btn').forEach(b=>{
        b.addEventListener('click', ()=> setMetric(b.dataset.metric));
      });
      // set active initially
      document.querySelectorAll('.metric-btn').forEach(b=>b.classList.toggle('active', b.dataset.metric === selectedMetric));
    }
  });

  // track currently playing button/url
  let currentPlayBtn = null;
  let currentPlayingUrl = '';
  let currentList = [];
  let currentIndex = -1;

  // sync icons on audio events
  if (audio){
    audio.addEventListener('pause', ()=>{
      // set all icons to play
      document.querySelectorAll('.play-icon-btn i').forEach(i=>i.className='fa-solid fa-play');
      if (currentPlayBtn){ const ic = currentPlayBtn.querySelector('i'); if (ic) ic.className='fa-solid fa-play'; }
      if (globalPlayBtn){ const gi = globalPlayBtn.querySelector('i'); if (gi) gi.className='fa-solid fa-play'; }
    });
    audio.addEventListener('play', ()=>{
      document.querySelectorAll('.play-icon-btn i').forEach(i=>i.className='fa-solid fa-play');
      if (currentPlayBtn){ const ic = currentPlayBtn.querySelector('i'); if (ic) ic.className='fa-solid fa-pause'; }
      if (globalPlayBtn){ const gi = globalPlayBtn.querySelector('i'); if (gi) gi.className='fa-solid fa-pause'; }
    });
    audio.addEventListener('ended', ()=>{
      // auto-next
      if (Array.isArray(currentList) && currentList.length && currentIndex >= 0){
        const next = currentIndex + 1;
        if (next < currentList.length){
          const nextRow = document.querySelector(`#chartBody tr[data-index="${next}"]`);
          const nextBtn = nextRow ? nextRow.querySelector('.play-icon-btn') : null;
          playUrl(currentList[next].url, nextBtn, next);
          return;
        }
      }
      // otherwise clear
      currentPlayingUrl = '';
      if (currentPlayBtn){ const ic = currentPlayBtn.querySelector('i'); if (ic) ic.className='fa-solid fa-play'; }
      if (globalPlayBtn){ const gi = globalPlayBtn.querySelector('i'); if (gi) gi.className='fa-solid fa-play'; }
    });
  }

  // Chart-level play button: play first track of table
  chartPlay?.addEventListener('click', ()=>{
    const first = document.querySelector('#chartBody tr[data-url]');
    if (first) playUrl(first.dataset.url, first.querySelector('.play-icon-btn'));
  });

  // Global play/pause button in header
  globalPlayBtn?.addEventListener('click', ()=>{
    if (!audio) return;
    if (!currentPlayingUrl){
      // start first track
      const first = document.querySelector('#chartBody tr[data-url]');
      if (first) { const btn = first.querySelector('.play-icon-btn'); playUrl(first.dataset.url, btn, Number(first.dataset.index)); }
      return;
    }
    // toggle
    if (audio.paused) audio.play().catch(()=>{}); else audio.pause();
  });

  // Spacebar toggles play/pause (avoid when typing in inputs)
  document.addEventListener('keydown', (e)=>{
    if (e.code !== 'Space') return;
    const tgt = e.target;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
    e.preventDefault();
    if (!audio) return;
    if (!currentPlayingUrl){
      const first = document.querySelector('#chartBody tr[data-url]');
      if (first) { const btn = first.querySelector('.play-icon-btn'); playUrl(first.dataset.url, btn, Number(first.dataset.index)); }
      return;
    }
    if (audio.paused) audio.play().catch(()=>{}); else audio.pause();
  });

  // listen for global count updates (likes/downloads) and refresh table
  window.addEventListener('songCountsChanged', (ev)=>{
    try{
      if (Array.isArray(currentList) && currentList.length) renderTable(currentList, selectedMetric);
    }catch(e){}
  });

})();