// Inner logic / Backend

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i.test(navigator.userAgent);
const randomStarterTrack = true;
var playerAPIready = false;
var currentPlayerState = -1;
var currentTrackDuration = 0;
var currentTrackElapsed = 0;
var playableTracks = [];
var currentVolume = 50;
var shuffle = false;
var replay = false;
var paused = false;
var muted = false;
var digitLogger = "";
var currentTrackIndex;
var playlistLength;
var currentTrack;
var playlist;
var player;

var prevState = -1;
const playerStateMap = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
};

init();

async function init() {
  const res = await fetch("playlist/playlist.json");
  playlist = await res.json();
  playlistLength = Object.keys(playlist).length;
  currentTrackIndex = randomIndex() * randomStarterTrack;
  currentTrack = playlist[currentTrackIndex];
  buildHTML();
  // This code loads the IFrame Player API code asynchronously
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
  // This function flags the API as ready and creates the player
  // Triggers once the API has fully downloaded
  playerAPIready = true;
  player = new YT.Player("player", {
    videoId: "",
    height: "0",
    width: "0",
    playerVars: {
      playsinline: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: tryNext
    }
  });
}

function onPlayerReady(event) {
  checkForStateChanges();
  player.setVolume(currentVolume);
  playIndex(currentTrackIndex);
}

function checkForStateChanges() {
  // https://stackoverflow.com/a/39160557
  setInterval(() => {
    currentTrackElapsed = player.getCurrentTime() - currentTrack["yt_start_s"];
    currentPlayerState = player.getPlayerState();
  },
    100);
}

function onPlayerStateChange(event) {
  if (videoIs("ENDED") && !videoWas("UNSTARTED")) { // Second condition prevents unwanted triggers probably caused by a blocked ad ending
    playNext();
  }
  highlightCurrentTrack();
  updateCurrentTrackDuration();
  prevState = player.getPlayerState();
}

function videoIs(state) {
  return player.getPlayerState() == playerStateMap[state];
}

function videoWas(state) {
  return prevState == playerStateMap[state];
}

function tryNext(event) {
  console.log("Error: Can't play track " + currentTrackIndex);
  replay = false;
  playNext();
}

function playIndex(index) {
  paused = false;
  currentTrackIndex = index;
  currentTrack = playlist[currentTrackIndex];
  player.loadVideoById({
    videoId: currentTrack["yt_id"],
    startSeconds: currentTrack["yt_start_s"],
    endSeconds: currentTrack["yt_end_s"]
  });
  changeVolume(0, muted);
  updateDisplay();
}

function playNext(step = 1) {
  playIndex(movedIndex(step));
}

function movedIndex(increment) {
  var index = currentTrackIndex;
  if (!replay) {
    if (shuffle) {
      index = randomIndex();
    } else {
      index += playlistLength + increment;
      index %= playlistLength;
    }
  }
  return index;
}

function togglePause() {
  if (videoIs("PLAYING")) {
    player.pauseVideo();
    paused = true;
  } else if (videoIs("PAUSED")) {
    player.playVideo();
    paused = false;
  }
}

function seek(seconds) {
  seconds = Math.max(seconds, 0);
  seconds += currentTrack["yt_start_s"];
  seconds = Math.min(currentTrackDuration + currentTrack["yt_start_s"], seconds);
  player.seekTo(seconds);
}

function skip(seconds) {
  seek(player.getCurrentTime() + seconds);
}

function seekLogged() {
  if (digitLogger) {
    seek(parseFloat("0." + digitLogger) * currentTrackDuration);
  }
}

function restartCurrentTrack() {
  seek(0);
}

function changeVolume(volumeDelta, mute = false) {
  muted = mute;
  currentVolume = Math.min(Math.max(currentVolume + volumeDelta, 0), 100);
  player.setVolume(currentVolume * currentTrack["volume_multiplier"] * !mute);
}

function playLogged() {
  if (digitLogger) {
    var index = Number(digitLogger) % playlistLength;
    if (playableTracks.includes(index.toString())) {
      replay = false;
      muted = false;
      playIndex(index);
    }
  }
}

function toggleMute() {
  changeVolume(0, !muted);
}

function toggleShuffle() {
  shuffle = !shuffle;
}

function toggleReplay() {
  replay = !replay;
}

function updateCurrentTrackDuration() {
  currentTrackDuration = Math.max(currentTrack["yt_end_s"] - currentTrack["yt_start_s"], 0);
  currentTrackDuration += (player.getDuration() - currentTrack["yt_start_s"]) * (currentTrackDuration == 0);
}

function updateDigitLogger(key) {
  if (!(isNaN(Number(key)) || key === null || key === ' ')) {
    digitLogger += key;
  } else {
    digitLogger = "";
  }
}

function randomIndex() {
  return Math.floor(Math.random() * (playlistLength + 1));
}

function validYtVideo(index, callback = console.log) {
  // https://gist.github.com/tonY1883/a3b85925081688de569b779b4657439b
  var valid;
  var img = new Image();
  img.src = "http://img.youtube.com/vi/" + playlist[index]["yt_id"] + "/mqdefault.jpg";
  img.onload = () => {
    valid = !(img.width === 120);
    callback(valid);
  }
}

// Interaction

document.addEventListener(
  "keypress",
  (event) => {
    // console.log(event.key);
    // console.log(event.code);
    if (playerAPIready) {
      switch (event.code) {
        case "Enter":
          playLogged();
          break;
        case "Space":
          event.preventDefault();
          togglePause();
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyZ":
          toggleShuffle();
          break;
        case "KeyX":
          toggleReplay();
          break;
        case "KeyR":
          restartCurrentTrack();
          break;
        case "KeyS":
          changeVolume(-5);
          break;
        case "KeyW":
          changeVolume(5);
          break;
        case "KeyA":
          playNext(-1);
          break;
        case "KeyD":
          playNext();
          break;
        case "KeyQ":
          skip(-5);
          break;
        case "KeyE":
          skip(5);
          break;
        case "Period":
          seekLogged();
          break;
      }
      updateDigitLogger(event.key);
      updateDisplay();
    }
  },
  false
);

// Graphics / Frontend

function buildHTML() {
  const tracklist = document.getElementById("tracklist");
  const cover_large_div = document.getElementById("cover_large_div");
  const cover_large = document.createElement("img");
  cover_large.setAttribute("src", "images/logo.jpg"); // Temp
  cover_large.setAttribute("id", "cover_large");
  cover_large.classList.add("prevent-select");
  cover_large_div.appendChild(cover_large);
  cover_large_div.setAttribute("onclick", "hideCover()");

  Object.keys(playlist).forEach(index => {
    const div_row = document.createElement("div");
    const div_info = document.createElement("div");
    const title = document.createElement("h3");
    const album_artists = document.createElement("p");
    const cover_div = document.createElement("div");
    const cover = document.createElement("img");
    var thumb_cover_path = "images/cover_art/" + playlist[index]["album_cover_filename"].slice(0, -4) + "_50.jpg";

    title.innerHTML = `${"<span class=\"index\">" + index.padStart(4, '0') + "</span> " + playlist[index]["title"]}`;
    album_artists.innerHTML = `${playlist[index]["album"] + " - " + playlist[index]["artists"]}`;
    cover.setAttribute("src", thumb_cover_path);
    cover.setAttribute("onclick", `showCover(${index})`);
    cover.classList.add("cover-thumb");
    title.classList.add("prevent-select");
    album_artists.classList.add("prevent-select");
    cover.classList.add("prevent-select");
    div_info.classList.add("info");

    div_info.appendChild(title);
    div_info.appendChild(album_artists);
    cover_div.appendChild(cover);
    div_row.appendChild(cover_div);
    div_row.appendChild(div_info);

    title.classList.add("fade");
    album_artists.classList.add("fade");
    cover_div.classList.add("cover-placeholder");
    div_row.setAttribute("id", index);
    if (!isMobile) { div_row.classList.add("hover"); }

    if (playlist[index]["yt_id"]) {
      playableTracks.push(index);
      div_row.setAttribute("ondblclick", `playIndex(${index})`);
      if (isMobile) { div_row.setAttribute("onclick", `playIndex(${index})`); }
    } else {
      div_row.classList.add("invalid-video");
      title.classList.add("invalid-video");
      album_artists.classList.add("invalid-video");
      cover.classList.add("invalid-video");
    }

    tracklist.appendChild(div_row);
  });
}

function showCover(index) {
  var cover_large_path = "images/cover_art/" + playlist[index]["album_cover_filename"].slice(0, -4) + "_440.jpg";
  const cover_large_div = document.getElementById("cover_large_div");
  const cover_large = document.getElementById("cover_large");
  cover_large.setAttribute("src", cover_large_path);
  cover_large.style.opacity = "1";
  cover_large_div.style.zIndex = "100";
}

function hideCover() {
  const cover_large_div = document.getElementById("cover_large_div");
  const cover_large = document.getElementById("cover_large");
  cover_large.style.opacity = "0";
  cover_large_div.style.zIndex = "-1";
  cover_large.setAttribute("src", "");
}

function highlightCurrentTrack() {
  Object.keys(playlist).forEach(index => {
    if (index == currentTrackIndex) {
      document.getElementById(index).setAttribute("playing", "true");
    } else {
      document.getElementById(index).setAttribute("playing", "false");
    }
  });
}

function updateDisplay() {
  if (playerAPIready) {
    updateTitle();
  }
}

function updateTitle() {
  var title = currentTrack["title"] + " - " + currentTrack["artists"];
  title += " | \u{1F50A}" + currentVolume + "%";
  title = "\u{1F507} ".repeat(muted) + title;
  title = "\u25B6\uFE0F ".repeat(!paused) + title;
  title = "\u23F8\uFE0F ".repeat(paused) + title;
  title = "\u{1F500} ".repeat(shuffle) + title;
  title = "\u{1F501} ".repeat(replay) + title;
  document.title = title;
}

function trackDurationForDisplay(index) {
  var displayDuration = Math.max(playlist[index]["yt_end_s"] - playlist[index]["yt_start_s"], 0);
  displayDuration += (playlist[index]["yt_duration_s"] - playlist[index]["yt_start_s"]) * (displayDuration == 0);
  return displayDuration;
}