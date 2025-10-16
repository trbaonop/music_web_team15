'use strict';



// ✅ Lấy danh sách nhạc mới từ localStorage
// 🔥 Xoá KEY_COLLECT_LIST để tránh bị load nhầm danh sách cũ
localStorage.removeItem('KEY_COLLECT_LIST');

let playList = JSON.parse(localStorage.getItem('KEY_PLAY_LIST')) || [];

console.log("🎵 Danh sách nhạc Cloudinary:", playList);

// ✅ Render danh sách ra giao diện
function renderMusicList() {
  const container = document.querySelector("#musicList"); // Thẻ chứa danh sách
  if (!container) return console.error("❌ Không tìm thấy thẻ #musicList");

  if (playList.length === 0) {
    container.innerHTML = "<p>Không có bài hát nào!</p>";
    return;
  }

  container.innerHTML = playList.map(song => `
    <div class="song-item">
      <img src="${song.imgPath_200}" alt="${song.name}" class="song-img">
      <div class="song-info">
        <h4>${song.name}</h4>
        <p>${song.author || "Không rõ"}</p>
        <audio controls src="${song.musicPath}"></audio>
      </div>
    </div>
  `).join("");
}

renderMusicList();

const lyricsLists = JSON.parse(localStorage.getItem(KEY_LYRICS_LIST) || '[]');
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

// 当前音乐列表序号
let currentMusic = 0

const audioSource = new Audio(playLists[currentMusic].musicPath);
audioSource.volume = 0.2

// showPlayList()
const showCollectList = $('[show-collect-list]')
const collectList = $('[collect-list]')

// showPlayListPage()
// showIndexPage()
const appHeader = $('[app_header]')
const appIndexPage = $('[app_index]')
const appCollectPage = $('[app_collect]')
const collectListsName = $$('[collect-list-name]')
const headerTabs = $('[header-left-tabs]')
const prevPageIcon = $('[prev-page-icon]')
const sideTabs = $('[side-tabs]')

// toggleRecord() - 显示隐藏播放记录
const playRecordBtn = $$('[play-record-btn]')
const playRecord = $('[play-record]')

// togglePanel() - 显示隐藏歌词面板
const appFooter = $$('[app_footer]')
const imgBoard = $('.imgBoard')
const songPanel = $('[song-panel]')
const closePanelBtn = $$('[close-panel-btn]')

// renderCollectList() - 初始化收藏列表歌曲
let collectListItem = $('[collect-list-item]')

// renderRecordList() - 初始化播放记录列表歌曲
let playRecordList = $('[play-record-ul]')

// playclickedLyrics() - 双击歌词，跳到对应播放
const playLyrics = $('[play-lyrics]')

// playRollLyrics(onlySkip)
// 歌词计时器数组
let playLyricsTimeout = []

// scrollUpLyrics() - 控制歌词向上滚动
const wrapLyrics = $('[wrap-lyrics]')
const scrollUpSpeed = 150

// lyricsGoHome() - 歌词回原位
let rollingTimeouter
let rollTransitionInterval
const goHomedelayTime = 2500
const transitionIntervalTime = 20
const transitionReduceNum = 50

// updatePlayInfo() - 修改 播放信息
const currentPlayImg70 = $$('[currentPlay-img70]')
const currentPlayImg200 = $$('[currentPlay-img200]')
const currentPlayImg400 = Array.from($$('[currentPlay-img400]'))
const currentPlayName = $$('[currentPlay-name]')
const currentPlayAuthor = $$('[currentPlay-author]')
const PlayElements = [currentPlayImg70, currentPlayImg200, currentPlayImg400, currentPlayName, currentPlayAuthor]

// updateRange() - 更新 进度条max 和 音乐总时长
const playTotalTime = $$("[play-totalTime]");
const playProgress = $$("[play-Progress]");

// updateRunningTime() - 播放音乐时更新时间
const playCurrentTime = $$("[play-currentTime")

// updateRangeColor() - 更新进度条 颜色范围
const playcolorFill = $$("[play-colorFill]")

// playMusic() - 播放|暂停 音乐
let playInterval
// 单位 ms
const updateIntervalTime = 500
const playBtns = $$("[play-btn]")
const playImgBorad = $('[play-imgBorad]')

// playSkipNext() - 跳过 下一首
const playNextBtns = $$("[play-next-btn]")

// playSkipPrev() - 跳过 上一首
const playPrevBtns = $$("[play-prev-btn]")

// shuffle() - 当前列表 设置随机播放
let isShuffle = false
const playShuffleBtn = document.querySelector("[play-shuffle]")

// isPlayMode() - 设置播放方式
let playMode = 0
// [单曲,列表循环,单曲循环]
const AllplayMode = [0, 1, 2]
const playModeBtn = $("[play-mode]")

// changeVolume() - 修改音量
const playVolumeRange = $("[play-volume-range]")
const playVolumeColorFill = $("[play-volume-colorFill]")

// muteVolume() - 设置静音
const playVolumeIcon = $("[play-volume-icon]")






/**
  * Helper
  * 
*/
const addEventOnElements = function (elements, eventType, callback) {
  for (let i = 0, len = elements.length; i < len; i++) {
    // bind指向 this，获取 event
    elements[i].addEventListener(eventType, callback.bind(this))
  }
}

const addEventOnElementChildren = function (elements, eventType, callback) {
  for (let i = 0, len = elements.children.length; i < len; i++) {
    elements.children[i].addEventListener(eventType, callback)
  }
}






/**
 * showPlayList()
 * 显示 收藏的歌单
 * 
 */

const showPlayList = function () {
  showCollectList.classList.toggle('active')
  collectList.classList.toggle('active')

}
showCollectList.addEventListener('click', showPlayList)




/**
 * showPlayListPage()
 * 显示 收藏的歌单 页面
 * 
 */

const showPlayListPage = function (e) {
  if (e.target.classList.contains('active')) return false

  for (let i = 0; i < sideTabs.children.length; i++) {
    sideTabs.children[i].classList.remove('active')
    sideTabs.children[i].classList.remove('fc-w')
  }

  e.target.classList.toggle('active')
  e.target.classList.toggle('fc-w')

  appHeader.style.backgroundColor = 'transparent'
  headerTabs.classList.toggle('none')

  appIndexPage.classList.toggle('none')
  appCollectPage.classList.toggle('none')

  prevPageIcon.classList.toggle('showCollect')

}
addEventOnElements(collectListsName, 'click', showPlayListPage)



/**
 * showIndexPage()
 * 显示 首页
 * 
 */
const showIndexPage = function (e) {
  if (e.target.classList.contains('active')) return false

  if (!e.target.classList.contains('menu-index')) {
    alert('敬请期待...')
    return false
  }

  console.log()
  collectListsName.forEach((li) => {
    li.classList.remove('active')
    li.classList.toggle('fc-w')
  })
  e.target.classList.toggle('active')
  e.target.classList.toggle('fc-w')

  appHeader.style.backgroundColor = '#fff'
  headerTabs.classList.toggle('none')

  appIndexPage.classList.toggle('none')
  appCollectPage.classList.toggle('none')

  prevPageIcon.classList.toggle('showCollect')

}
addEventOnElementChildren(sideTabs, 'click', showIndexPage)


/**
 * toggleRecord()
 * 显示|隐藏 播放记录(aside)
 * 
 */

const toggleRecord = function (e) {
  e.stopPropagation()
  playRecord.classList.toggle('active')
}
addEventOnElements(playRecordBtn, 'click', toggleRecord)




/**
 * togglePanel()
 * 显示|隐藏 歌词面板
 * 
 */
const togglePanel = function (e) {
  imgBoard.classList.toggle('active')
  songPanel.classList.toggle('active')
}
addEventOnElements(appFooter, 'click', togglePanel)
addEventOnElements(closePanelBtn, 'click', togglePanel)



/**
 * getCurrentMusicLyrics()
 * 获取当前音乐 歌词和时间
 * 
 */
const getCurrentMusicLyrics = function () {
  for (let [idx, data] of lyricsLists.entries()) {
    if (data.musicId === playLists[currentMusic].id) {
      return {
        'text': data.text,
        'timer': data.timer
      }
    } else {
      return {
        'text': ['加载歌词中...'],
        'timer': []
      }
    }
  }
  console.log(currentMusic)
}
let currentMusicLyrics = getCurrentMusicLyrics().text
let currentLyricsTimer_init = getCurrentMusicLyrics().timer
let currentLyricsTimer_change = [...currentLyricsTimer_init]



/**
 * renderLyrics()
 * 渲染 歌词
 * 
 */

const renderLyrics = function () {
  currentMusicLyrics = getCurrentMusicLyrics().text
  currentLyricsTimer_init = getCurrentMusicLyrics().timer
  // console.log(currentMusicLyrics)
  playLyrics.innerHTML = ''
  for (let [idx, data] of currentMusicLyrics.entries()) {
    playLyrics.innerHTML += `
    <div id="line-${idx + 1}" data-time="${currentLyricsTimer_init[idx]}" class="lyric ${idx === 0 ? "active" : ""}">
      <span class="">
        ${data}
      </span>
    </div>
    `
  }
  addEventOnElementChildren(playLyrics, 'dblclick', playclickedLyrics)
}
// renderLyrics()






/**
 * playSelectMusic()
 * 播放选中的音乐
 * 
 */
 const playSelectMusic = function (e) {
  currentMusic = this.dataset.id
  let playArray = Array.from(this.parentNode.children)

  playArray.forEach((element) => {
    element.classList.remove('active')
  })
  this.classList.add('active')

  playingTool()
}




/**
 * renderRecordList()
 * 初始化 播放记录列表。(暂时固定顺序、active)
 * 
 */
 const renderRecordList = function () {
  for (let [idx, music] of playLists.entries()) {
    // console.log(idx)
    playRecordList.innerHTML += `
    <li class="body-palyList flex  ${idx === 1 ? "active" : ""}" data-id='${idx}'>
      <div class="palyList-data flex">
        <div class="data-img">
          <img src="${music.imgPath_70}" alt="">
        </div>
        <div class="data-info ">
          <div class="data-name  text-ol fs-14 fw-5">
            <span class="text">${music.name}</span>
          </div>
          <div class="data-from text-ol fs-12 ">
            <span class="author underline">${music.author}</span>
            <span class="separator">-</span>
            <span class="album underline text-ol">${music.album}</span>
          </div>
        </div>
        <!-- 更多操作-图标 -->
        <div class="more-moreActions flex">
          <button class="moreActions-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"
              class="icon " stroke-width="5" stroke-linecap="butt" stroke-linejoin="miter">
              <path d="M38 25v-2h2v2h-2ZM23 25v-2h2v2h-2ZM8 25v-2h2v2H8Z" fill="currentColor" stroke="none">
              </path>
              <path d="M38 25v-2h2v2h-2ZM23 25v-2h2v2h-2ZM8 25v-2h2v2H8Z"></path>
            </svg>
          </button>
        </div>
      </div>
    </li>              
    `
  }
  // playRecordList = $('[play-record-ul]')
  addEventOnElementChildren(playRecordList, 'dblclick', playSelectMusic)
}
renderRecordList()




/**
 * renderCollectList()
 * 初始化 收藏列表
 */

 const renderCollectList = function () {
  for (let [idx, music] of playLists.entries()) {
    // console.log(idx)
    collectListItem.innerHTML += `
    <div class="contentList-item flex fs-14 fw-5"  data-id='${idx}'>
      <div class="item-img">
        <img src="${music.imgPath_70}" alt="">
      </div>
      <div class="item-title text-ol ">${music.name}</div>
      <div class="item-author text-ol underline ">${music.author}</div>
      <div class="item-album text-ol underline ">${music.album}</div>
      <div class="item-totalTime text-ol flex">${music.time}</div>
      <div class="item-moreIcon">
        <span class="moreIcon flex">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"
            class="icon " stroke-width="5" stroke-linecap="butt" stroke-linejoin="miter"
            data-v-85cbcb09="">
            <path d="M38 25v-2h2v2h-2ZM23 25v-2h2v2h-2ZM8 25v-2h2v2H8Z" fill="currentColor" stroke="none">
            </path>
            <path d="M38 25v-2h2v2h-2ZM23 25v-2h2v2h-2ZM8 25v-2h2v2H8Z"></path>
          </svg>
        </span>
      </div>
    </div>                 
    `
  }
  addEventOnElementChildren(collectListItem, 'dblclick', playSelectMusic)
}
renderCollectList()




/**
 * playRollLyrics(onlySkip)
 * 参数1 onlySkip - true表示只跳到对应歌词，不更新计时器数组
 * 播放时，处理歌词滚动
 * 
 */

const playRollLyrics = function (onlySkip = false) {
  currentLyricsTimer_change = PauseLyricsTimer()

  const currentLyricsIndex = currentLyricsTimer_init.length - currentLyricsTimer_change.length
  // console.log(currentLyricsIndex)
  if (onlySkip) {
    skipLyrics(currentLyricsIndex)

    // 如果是暂停状态，只跳歌词，不需要计时器
    if (audioSource.paused) {
      return
    }
  }

  for (let i = 0; i < currentLyricsTimer_change.length; i++) {
    playLyricsTimeout[i] = setTimeout(function () {
      // for (let j = 0; j < playLyrics.children.length; j++){
      //   playLyrics.children[j].style.transform = `translateY(${-100 * i}%)`
      // }
      let j = currentLyricsIndex + i
      playLyrics.style.transform = `translateY(${-80 * j}px)`
      // playLyrics.scrollTop='0'

      for (let idx = 0; idx < playLyrics.children.length; idx++) {
        playLyrics.children[idx].classList.remove('active')
      }
      playLyrics.children[j].classList.add('active')
    }, Math.round(currentLyricsTimer_change[i] * 1000))

  }
}



/**
 * skipLyrics()
 * 如果鼠标改变播放进度，直接跳到对应的歌词
 */
const skipLyrics = function (currentLyricsIndex) {
  currentLyricsIndex = currentLyricsIndex <= 0 ? 0 : currentLyricsIndex - 1

  for (let k = 0; k < playLyrics.children.length; k++) {
    playLyrics.children[k].classList.remove('active')
  }
  playLyrics.children[currentLyricsIndex].classList.add('active')
  playLyrics.style.transform = `translateY(${-80 * currentLyricsIndex}px)`
}





/**
 * playclickedLyrics()
 * 双击歌词，跳到对应播放
 */
const playclickedLyrics = function (e) {

  let lyricsDiv = e.target
  if (e.target.tagName === 'SPAN') {
    lyricsDiv = e.target.parentNode
  }
  audioSource.currentTime = Number(lyricsDiv.getAttribute("data-time"))

  // 正在播放，不需要 playMusic()
  if (audioSource.paused) {
    playMusic()
  } else {
    audioSource.play()
    // 关闭 歌词计时器
    clearAllLyricsTimeout()
    // 歌词滚动处理
    playRollLyrics()
  }
}






/**
 * scrollUpLyrics()
 * 使用 tansform 后，导致不能向上滚动，可自行设置(调整滑动速度)
 * 
 */

const scrollUpLyrics = function (e) {
  const matrix = getComputedStyle(playLyrics).getPropertyValue('transform')
  // 矩阵各个值
  //matrix(scaleX, skewY, skewX, scaleY, translateX, translateY)
  const translateY = Number(matrix.split(' ').pop().split(')')[0])

  if (!playLyrics.children[0].classList.contains('active') && e.deltaY < 0) {
    playLyrics.style.transform = `translateY(${translateY + scrollUpSpeed}px)`
  }
}
wrapLyrics.addEventListener('wheel',scrollUpLyrics)



/**
 * lyricsGoHome()
 * 鼠标滚动歌词后，停止滚动一段时间(2.5s)后， 返回原位
 * 通过 setInterval 加一个 歌词回原位 过渡效果
 * 
 */
const lyricsGoHome = function (e) {
  if (rollingTimeouter) {
    clearTimeout(rollingTimeouter)
  }
  rollingTimeouter = setTimeout(() => {
    // 过渡效果
    rollTransitionInterval = setInterval(() => {
      e.target.scrollTop = e.target.scrollTop - transitionReduceNum < 0 ? 0 : e.target.scrollTop - transitionReduceNum
      if (e.target.scrollTop === 0) {

        clearInterval(rollTransitionInterval)
      }
    }, transitionIntervalTime)
  }, goHomedelayTime)
}
wrapLyrics.addEventListener('scroll', lyricsGoHome)





/**
 * clearAllLyricsTimeout()
 * 清除所有 歌词计时器
 */
const clearAllLyricsTimeout = function () {
  playLyricsTimeout.forEach((timeouter) => {
    clearTimeout(timeouter)
  })
}





/** 
 * updatePlayInfo()
 * 修改 播放信息
 */

const updatePlayInfo = function () {
  for (let index in PlayElements) {
    PlayElements[index].forEach((ele) => {
      if (index <= 1) {
        ele.src = playLists[currentMusic].imgPath_70
        ele.alt = '...'
      } else if (index == 2) {
        let imgSrc = playLists[currentMusic].imgPath_400
        if (Array.from(ele.classList).includes('imgBoard')) {
          imgSrc = imgSrc ? imgSrc : './data/imgs/photo-1.jpg'
        }

        ele.src = imgSrc
        ele.alt = '...'
      }
      else if (index == 3) {
        ele.textContent = playLists[currentMusic].name
        ele.title = playLists[currentMusic].name
      } else {
        ele.textContent = playLists[currentMusic].author
        ele.title = playLists[currentMusic].author
      }
    })
  }

  audioSource.src = playLists[currentMusic].musicPath

  // 更新歌词
  renderLyrics()
  clearAllLyricsTimeout()
  PauseLyricsTimer()

  // console.log(currentMusic)
}




/** 
 * updateRange()
 * 修改 进度条 max
 * 修改 音乐总时间（从音频获取总长）
 */
const updateRange = function () {
  for (let i = 0; i < playProgress.length; i++) {
    playProgress[i].max = Math.ceil(audioSource.duration)
    playTotalTime[i].textContent = getTotalTime(Number(playProgress[i].max))
  }
}
audioSource.addEventListener("loadeddata", updateRange);




/** 
 * getTotalTime()
 * 获取总时长，秒 -> 分（170s -> 2m50s）
 */
const getTotalTime = function (duration) {
  const minutes = Math.floor(duration / 60)
  const seconds = Math.ceil(duration - (minutes * 60))
  const totalTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  return totalTime
}



/** 
 * updateRunningTime()
 * 播放音乐时更新时间(当前播放进度时间) 
 * 
 */

const updateRunningTime = function () {
  for (let i = 0; i < playProgress.length; i++) {
    // 当前播放秒 = 进度条 value
    playProgress[i].value = audioSource.currentTime
    playCurrentTime[i].textContent = getTotalTime(audioSource.currentTime)
  }

  // 改变 进度条颜色范围
  updateRangeColor()
  musicPlayEnd()
}



/**
 * updateRangeColor()
 * 更新进度条 填充颜色
 */

const updateRangeColor = function (e) {
  let element = playProgress[0]
  if (typeof (e) != "undefined") {
    element = e.target
  }

  // 填充颜色 百分值
  const rangeValue = (element.value / element.max) * 100

  for (let i = 0; i < playcolorFill.length; i++) {
    playcolorFill[i].style.width = `${rangeValue}%`
    if (rangeValue < 20) {
      element.value = element.value -1
    }
    playProgress[i].value = element.value
  }
}

addEventOnElements(playProgress, "input", updateRangeColor)
addEventOnElements(playProgress, "click", function (e) {
  e.stopPropagation()
})





/**
 * updatePlaytime()
 * 更新进度条值
 * 更新 音乐播放|当前播放时间
 *  
 */
const updatePlaytime = function (e) {
  e.stopPropagation()

  // 进度条 value = 音乐 currentTime
  audioSource.currentTime = e.target.value
  for (let i = 0; i < playProgress.length; i++) {
    playCurrentTime[i].textContent = getTotalTime(e.target.value)
  }

  // 更新计时器 + 滚动歌词
  clearAllLyricsTimeout()
  playRollLyrics(true)
}
addEventOnElements(playProgress, "input", updatePlaytime)




/**
 * musicPlayEnd()
 * 音乐播放结束
 */
const musicPlayEnd = function () {
  if (audioSource.ended) {
    playBtns.forEach((playBtn) => {
      playBtn.classList.remove("playing")
      playBtn.classList.add("pause")
    })
    // 列表循环
    if (playMode == 1) {
      playSkipNext()
    }
  }
}




/**
 * playMusic()
 * 控制 播放|暂停 音乐
 */

const playMusic = function (e) {
  e = event || window.event
  e.stopPropagation()

  // loadeddata - 当前帧的数据加载完成且还没有足够的数据播放下一帧时
  audioSource.addEventListener("loadeddata", updateRange)
  if (audioSource.paused) {
    audioSource.play()
    // 歌词滚动
    playRollLyrics()

    // 播放 按钮样式
    playBtns.forEach((btn) => {
      btn.classList.add("playing")
      btn.classList.remove("pause")
    })

    //列表(收藏歌单、) 选中样式
    for (let i = 0; i < collectListItem.children.length; i++) {
      collectListItem.children[i].classList.remove('active')
      playRecordList.children[i].classList.remove('active')
    }
    collectListItem.children[currentMusic].classList.add('active')
    playRecordList.children[currentMusic].classList.add('active')

    playImgBorad.classList.toggle('active')

    // 每0.5s，更新 当前播放时间
    playInterval = setInterval(updateRunningTime, updateIntervalTime)

  } else {
    audioSource.pause()

    playBtns.forEach((btn) => {
      btn.classList.add("pause")
      btn.classList.remove("playing")
    })
    playImgBorad.classList.toggle('active')


    // 关闭 播放时间计时器
    clearInterval(playInterval)
    // 关闭 歌词计时器
    clearAllLyricsTimeout()

  }
}
addEventOnElements(playBtns, 'click', playMusic)




/**
 * PauseLyricsTimer()
 * 播放暂停时，记录 暂停时间，重新设置 歌词时间数组
 */

const PauseLyricsTimer = function () {

  currentLyricsTimer_change = [...currentLyricsTimer_init]
  // console.log(currentLyricsTimer_change)
  for (let i = 0; i < currentLyricsTimer_change.length; i++) {
    if (currentLyricsTimer_change[i] >= audioSource.currentTime) {
      currentLyricsTimer_change.splice(0, i)
      break
    }
    else {
      // 当大于 全部歌词时间 
      if (i === currentLyricsTimer_change.length - 1) {
        return []
      }
    }
  }
  currentLyricsTimer_change = currentLyricsTimer_change.map((timer) => {
    // 保留3位，刚好对应毫秒
    timer = Number((timer - audioSource.currentTime).toFixed(3))
    return timer
  })
  return currentLyricsTimer_change
}




/**
 * playSkipNext()
 * 跳过 下一首
 */

const playSkipNext = function (e) {
  e.stopPropagation()

  //  lastPlayedMusic = currentMusic;
  // 是否 随机
  if (isShuffle) {
    shuffleMusic()
  } else {
    // 是否超出 播放列表数
    currentMusic >= playLists.length - 1 ? currentMusic = 0 : currentMusic++
  }
  playingTool()
}
addEventOnElements(playNextBtns, "click", playSkipNext)





/**
 * playSkipPrev()
 * 跳过 上一首
 */

const playSkipPrev = function (e) {
  e.stopPropagation()
  if (isShuffle) {
    shuffleMusic()
  } else {
    currentMusic <= 0 ? currentMusic = playLists.length - 1 : currentMusic--
  }

  playingTool()
}
addEventOnElements(playPrevBtns, "click", playSkipPrev)





/**
 * shuffle()
 * 当前列表 随机播放
 */

const getRandomMusic = () => Math.floor(Math.random() * playLists.length)
const shuffleMusic = () => currentMusic = getRandomMusic()
const shuffle = function (e) {
  e.stopPropagation()
  playShuffleBtn.classList.toggle("active")
  isShuffle = isShuffle ? false : true
}
playShuffleBtn.addEventListener("click", shuffle)



/**
 * 
 * isPlayMode()
 * 设置 播放方式
 */
const isPlayMode = function (e) {
  e.stopPropagation()
  playMode >= 2 ? playMode = 0 : playMode++
  if (playMode == AllplayMode[0]) {
    audioSource.loop = false;
    this.classList.remove("singleLoop");
    this.classList.add("single");

  } else if (playMode == AllplayMode[1]) {
    this.classList.remove("single");
    this.classList.add("listLoop");
  } else if (playMode == AllplayMode[2]) {
    audioSource.loop = true;
    this.classList.remove("listLoop");
    this.classList.add("singleLoop");
  }
}

playModeBtn.addEventListener("click", isPlayMode)




/**
 * 
 * changeVolume()
 * 修改音量
 */

const changeVolume = function (e) {
  e.stopPropagation()

  playVolumeIcon.classList.add('sound')
  playVolumeIcon.classList.remove('mute')

  audioSource.volume = playVolumeRange.value

  const rangeValue = (playVolumeRange.value / playVolumeRange.max) * 100
  playVolumeColorFill.style.width = `${rangeValue}%`
  // console.log(audioSource.volume)
  // 开启音量 
  audioSource.muted = false
}
playVolumeRange.addEventListener("input", changeVolume)
playVolumeRange.addEventListener("click", function (e) {
  e.stopPropagation()
})



/**
 * muteVolume()
 * 设置静音
 */

const muteVolume = function (e) {
  e.stopPropagation()
  if (!audioSource.muted) {
    playVolumeIcon.classList.add('mute')
    playVolumeIcon.classList.remove('sound')
    audioSource.muted = true;
  } else {
    changeVolume();
  }
}
playVolumeIcon.addEventListener("click", muteVolume);



const playingTool = function () {
  updatePlayInfo()
  playMusic()
}







const Start = function () {
  updatePlayInfo()
}

Start()