// Inner logic / Backend

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i.test(navigator.userAgent);
const frontend = "https://piped.kavin.rocks/watch?v="; // "https://yewtu.be/watch?v=";
const randomStarterTrack = true;
let debug = false;
let debugUnplayable = []
let playerAPIready = false;
let currentPlayerState = -1;
let currentTrackDuration = 0;
let currentTrackElapsed = 0;
let playableTracks = [];
let currentVolume = 50 + 50*isMobile;
let shuffle = false;
let replay = false;
let paused = false;
let muted = false;
let digitLogger = "";
let currentTrackIndex;
let playlistLength;
let currentTrack;
let playlist;
let player;

let prevState = -1;
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
  let tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  let firstScriptTag = document.getElementsByTagName("script")[0];
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
  if (debug && videoIs("PLAYING")) { // Toggle debug to test all tracks
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
  console.log("Error: Can't play track " + currentTrackIndex, playlist[currentTrackIndex]["title"]);
  if (!debugUnplayable.includes(currentTrackIndex) && playlist[currentTrackIndex]["yt_id"]) {
    debugUnplayable.push(currentTrackIndex);
  }
  replay = false;
  playNext();
}

function playIndex(index) {
  paused = false;
  currentTrackIndex = index;
  currentTrack = playlist[currentTrackIndex];
  changeVolume(0, muted);
  player.loadVideoById({
    videoId: currentTrack["yt_id"],
    startSeconds: currentTrack["yt_start_s"],
    endSeconds: currentTrack["yt_end_s"]
  });
  updateDisplay();
}

function playNext(step = 1) {
  playIndex(movedIndex(step));
}

function movedIndex(increment) {
  let index = currentTrackIndex;
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
  seconds = Math.max(seconds, currentTrack["yt_start_s"]);
  if (seconds >= currentTrackDuration + currentTrack["yt_start_s"]) {
    playNext();
  } else {
    player.seekTo(seconds);
  }
}

function skip(seconds) {
  seek(player.getCurrentTime() + seconds);
}

function seekLogged() {
  if (digitLogger) {
    seek(parseFloat("0." + digitLogger) * currentTrackDuration + currentTrack["yt_start_s"]);
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
    let index = Number(digitLogger) % playlistLength;
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
  let valid;
  let img = new Image();
  img.src = "http://img.youtube.com/vi/" + playlist[index]["yt_id"] + "/mqdefault.jpg";
  img.onload = () => {
    valid = !(img.width === 120);
    callback(valid);
  }
}

// Interaction

document.addEventListener(
  "keydown",
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
        case "Tab":
          event.preventDefault();
          autoScroll();
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
  cover_large.setAttribute("src", "");
  cover_large.setAttribute("id", "cover_large");
  cover_large.classList.add("prevent-select");
  cover_large_div.appendChild(cover_large);
  cover_large_div.setAttribute("onclick", "hideCover()");
  let totalPlaylistDuration = 0;

  Object.keys(playlist).forEach(index => {
    const div_row = document.createElement("div");
    const div_info = document.createElement("div");
    const title = document.createElement("h3");
    const album_artists = document.createElement("p");
    const outButton = document.createElement("span");
    const duration = document.createElement("h4");
    const cover_div = document.createElement("div");
    const cover = document.createElement("img");
    let thumb_cover_path = "images/cover_art/" + playlist[index]["album_cover_filename"].slice(0, -4) + "_50.jpg";
    let trackDuration = trackDurationForDisplay(index);
    let formattedDuration = "??:??"

    title.innerHTML = `${"<span class=\"index\">" + index.padStart(4, '0') + "</span> " + playlist[index]["title"]}`;
    album_artists.innerHTML = `${playlist[index]["album"] + " - " + playlist[index]["artists"]}`;
    outButton.innerHTML = "arrow_outward";
    cover.setAttribute("src", thumb_cover_path);
    cover.setAttribute("onclick", `showCover(${index})`);
    cover.classList.add("cover-thumb");
    title.classList.add("prevent-select");
    album_artists.classList.add("prevent-select");
    outButton.classList.add("material-symbols-outlined");
    outButton.classList.add("prevent-select");
    duration.classList.add("prevent-select");
    cover.classList.add("prevent-select");
    div_info.classList.add("info");

    div_info.appendChild(title);
    div_info.appendChild(album_artists);
    div_info.append(outButton);
    div_info.appendChild(duration);
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
      outButton.setAttribute("onclick", `openTab(${index})`);
      if (isMobile) { div_row.setAttribute("onclick", `playIndex(${index})`); }
      if (trackDuration < 3600*2) {
        formattedDuration = formattedParsedDuration(trackDuration);
        totalPlaylistDuration += trackDuration;
      }
    } else {
      div_row.classList.add("invalid-video");
      title.classList.add("invalid-video");
      album_artists.classList.add("invalid-video");
      outButton.classList.add("invalid-video");
      duration.classList.add("invalid-video");
      cover.classList.add("invalid-video");
    }
    duration.innerHTML = formattedDuration;
    tracklist.appendChild(div_row);
  });
  const [totalDays, totalHours, totalMinutes, totalSeconds] = parseDuration(totalPlaylistDuration);
  const playlist_duration = document.getElementById("playlist_duration");
  playlist_duration.innerHTML = `Total length (no rain): ${totalDays} days, ${totalHours} hours, ${totalMinutes} minutes and ${totalSeconds} seconds`;
}

function showCover(index) {
  let cover_large_path = "images/cover_art/" + playlist[index]["album_cover_filename"].slice(0, -4) + "_440.jpg";
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

function openTab(index) {
  let link = frontend + playlist[index]["yt_id"];
  let start = playlist[index]["yt_start_s"];
  let end = playlist[index]["yt_end_s"];
  if (start) { link += "&start=" + Math.floor(start) + "s"; }
  if (end) { link += "&end=" + Math.floor(end) + "s"; }
  window.open(link, "_blank");
}

function autoScroll() {
  window.scrollTo(0, window.scrollY + document.getElementById(currentTrackIndex).getBoundingClientRect().top);
}

function highlightCurrentTrack() {
  // Naive
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
  let title = currentTrack["title"] + " - " + currentTrack["artists"];
  title += " | \u{1F50A}" + currentVolume + "%";
  title = "\u{1F507} ".repeat(muted) + title;
  title = "\u25B6\uFE0F ".repeat(!paused) + title;
  title = "\u23F8\uFE0F ".repeat(paused) + title;
  title = "\u{1F500} ".repeat(shuffle) + title;
  title = "\u{1F501} ".repeat(replay) + title;
  document.title = title;
}

function trackDurationForDisplay(index) {
  let displayDuration = Math.max(playlist[index]["yt_end_s"] - playlist[index]["yt_start_s"], 0);
  displayDuration += (playlist[index]["yt_duration_s"] - playlist[index]["yt_start_s"]) * (displayDuration == 0);
  return displayDuration;
}

function parseDuration(seconds) {
  seconds = Math.floor(seconds)
  let perDay = 60*60*24;
  let perHr = 60*60;
  let perMin = 60;
  let days = Math.floor(seconds / perDay);
  seconds -= days*perDay;
  let hours = Math.floor(seconds / perHr);
  seconds -= hours*perHr;
  let minutes = Math.floor(seconds / perMin);
  seconds -= minutes*perMin;
  return [days, hours, minutes, seconds];
}

function formattedParsedDuration(totalSeconds) {
  let [days, hours, minutes, seconds] = parseDuration(totalSeconds);
  minutes = minutes + 60*hours + 24*60*days;
  return minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');
}