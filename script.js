// Inner logic / Backend

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i.test(navigator.userAgent);
const frontend = "https://youtube.com/watch?v="; // "https://yewtu.be/watch?v="; "https://piped.kavin.rocks/watch?v=";
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
let custom = false;
let anchor = false;
let anchorScrollException = false;
let digitLogger = "";
let currentTrackFullPlaylistIndex;
let fullPlaylistLength;
let currentTrack;
let fullPlaylist;
let playlist = [];
let currentTrackIndex = -1;
let player;

let prevState = -1;
const playerStateMap = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
};

let played_bar = document.getElementById("played_bar_bg");

init();

async function init() {
  const res = await fetch("playlist/playlist.json");
  fullPlaylist = await res.json();
  fullPlaylistLength = Object.keys(fullPlaylist).length;
  currentTrackFullPlaylistIndex = randomIndex() * randomStarterTrack;
  currentTrack = fullPlaylist[currentTrackFullPlaylistIndex];
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
  playIndex(currentTrackFullPlaylistIndex);
}

function checkForStateChanges() {
  // https://stackoverflow.com/a/39160557
  setInterval(() => {
      currentTrackElapsed = player.getCurrentTime() - currentTrack["yt_start_s"];
      currentPlayerState = player.getPlayerState();
      updatePlayedBar();
    },
    100
  );
}

function onPlayerStateChange(event) {
  if (videoIs("ENDED") && !videoWas("UNSTARTED")) { // Second condition prevents unwanted triggers probably caused by a blocked ad ending
    playNext();
  }
  if (debug && videoIs("PLAYING")) { // Toggle debug to test all tracks the looooong way
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
  console.log("Error: Can't play track " + currentTrackFullPlaylistIndex, fullPlaylist[currentTrackFullPlaylistIndex]["title"]);
  if (!debugUnplayable.includes(currentTrackFullPlaylistIndex) && fullPlaylist[currentTrackFullPlaylistIndex]["yt_id"]) {
    debugUnplayable.push(currentTrackFullPlaylistIndex);
  }
  replay = false;
  playNext();
}

function playIndex(index) {
  paused = false;
  currentTrackFullPlaylistIndex = index;
  updateCurrentTrackIndex();
  currentTrack = fullPlaylist[currentTrackFullPlaylistIndex];
  changeVolume(0, muted);
  player.loadVideoById({
    videoId: currentTrack["yt_id"],
    startSeconds: currentTrack["yt_start_s"],
    endSeconds: currentTrack["yt_end_s"]
  });
  updateDisplay();
  if (anchor) {
    autoScroll();
  }
}

function playNext(step = 1) {
  playIndex(movedIndex(step));
}

function movedIndex(increment) {
  let index = currentTrackFullPlaylistIndex;
  if (!replay) {
    if (shuffle) {
      index = randomIndex();
    } else {
      if (playlist.length > 0) {
        index = playlist.length + currentTrackIndex + increment;
        index %= playlist.length;
        index = playlist[index];
      } else {
        index += fullPlaylistLength + increment;
        index %= fullPlaylistLength;
      }
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

function seekFraction(fraction) {
  seek(fraction * currentTrackDuration + currentTrack["yt_start_s"]);
}

function skip(seconds) {
  seek(player.getCurrentTime() + seconds);
}

function seekLogged() {
  if (digitLogger) {
    seekFraction(parseFloat("0." + digitLogger));
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
    let index = Number(digitLogger) % fullPlaylistLength;
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

function toggleAnchor(event) {
  event.preventDefault();
  anchor = !anchor;
  autoScroll();
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
  if (playlist.length > 0) {
    return playlist[Math.floor(Math.random() * playlist.length)];
  }
  return Math.floor(Math.random() * fullPlaylistLength);
}

function updateCurrentTrackIndex() {
  let index = playlist.indexOf(currentTrackFullPlaylistIndex);
  if (index > -1) {
    currentTrackIndex = index;
  }
}

function validYtVideo(index, callback = console.log) {
  // https://gist.github.com/tonY1883/a3b85925081688de569b779b4657439b
  let valid;
  let img = new Image();
  img.src = "http://img.youtube.com/vi/" + fullPlaylist[index]["yt_id"] + "/mqdefault.jpg";
  img.onload = () => {
    valid = !(img.width === 120);
    callback(valid);
  }
}

// Interaction

document.addEventListener(
  "scroll", 
  (event) => {
    if (!anchorScrollException) {
      anchor = false;
      updateTitle();
    } else {
      anchorScrollException = false;
    }
  }
);

played_bar.addEventListener(
  "click",
  (event) => {
    console.log(event.clientX/played_bar.offsetWidth);
    seekFraction(event.clientX/played_bar.offsetWidth);
  }
);

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
        case "KeyP":
          editPlaylist();
          updatePlaylistDisplay();
          break;
        case "Period":
          seekLogged();
          break;
        case "Tab":
          toggleAnchor(event);
          break;
        case "Backspace":
          digitLogger = "";
          break;
        case "Escape":
          deletePlaylist();
          updatePlaylistDisplay(true);
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

  Object.keys(fullPlaylist).forEach(index => {
    const div_row = document.createElement("div");
    const div_info = document.createElement("div");
    const title = document.createElement("h3");
    const album_artists = document.createElement("p");
    const outButton = document.createElement("span");
    const duration = document.createElement("h4");
    const playlistIndex = document.createElement("h5");
    const cover_div = document.createElement("div");
    const cover = document.createElement("img");
    let thumb_cover_path = "images/cover_art/" + fullPlaylist[index]["album_cover_filename"].slice(0, -4) + "_50.jpg";
    let trackDuration = trackDurationForDisplay(index);
    let formattedDuration = "??:??";
    let formattedPlaylistIndex = "0000 |";

    title.innerHTML = `${"<span class=\"index\">" + index.padStart(4, '0') + "</span> " + fullPlaylist[index]["title"]}`;
    album_artists.innerHTML = `${fullPlaylist[index]["album"] + " - " + fullPlaylist[index]["artists"]}`;
    outButton.innerHTML = "arrow_outward";
    playlistIndex.innerHTML = formattedPlaylistIndex;

    cover.setAttribute("src", thumb_cover_path);
    cover.setAttribute("onclick", `showCover(${index})`);
    cover.classList.add("cover-thumb");
    title.classList.add("prevent-select");
    album_artists.classList.add("prevent-select");
    outButton.classList.add("material-symbols-outlined");
    outButton.classList.add("prevent-select");
    duration.classList.add("prevent-select");
    playlistIndex.classList.add("prevent-select");
    cover.classList.add("prevent-select");
    div_info.classList.add("info");

    div_info.appendChild(title);
    div_info.appendChild(album_artists);
    div_info.appendChild(outButton);
    div_info.appendChild(duration);
    div_info.appendChild(playlistIndex);
    cover_div.appendChild(cover);
    div_row.appendChild(cover_div);
    div_row.appendChild(div_info);

    title.classList.add("fade");
    album_artists.classList.add("fade");
    cover_div.classList.add("cover-placeholder");
    div_row.setAttribute("id", index);
    if (!isMobile) { div_row.classList.add("hover"); }

    if (fullPlaylist[index]["yt_id"]) {
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
  let cover_large_path = "images/cover_art/" + fullPlaylist[index]["album_cover_filename"].slice(0, -4) + "_440.jpg";
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
  let link = frontend + fullPlaylist[index]["yt_id"];
  let start = fullPlaylist[index]["yt_start_s"];
  let end = fullPlaylist[index]["yt_end_s"];
  if (start) { link += "&start=" + Math.floor(start) + "s"; }
  if (end) { link += "&end=" + Math.floor(end) + "s"; }
  window.open(link, "_blank");
}

function autoScroll() {
  anchorScrollException = true;
  window.scrollTo(0, window.scrollY + document.getElementById(currentTrackFullPlaylistIndex).getBoundingClientRect().top);
}

function highlightCurrentTrack() {
  // Naive
  Object.keys(fullPlaylist).forEach(index => {
    if (index == currentTrackFullPlaylistIndex) {
      document.getElementById(index).setAttribute("playing", "true");
    } else {
      document.getElementById(index).setAttribute("playing", "false");
    }
  });
}

function updateDisplay() {
  if (playerAPIready) {
    updateTitle();
    updatePlayedBar();
  }
}

function updateTitle() {
  let title = currentTrack["title"] + " - " + currentTrack["artists"];
  title += " | \u{1F50A}" + currentVolume + "%";
  title = "\u{1F507} ".repeat(muted) + title;
  title = "\u2693\uFE0F ".repeat(anchor) + title;
  title = "\u25B6\uFE0F ".repeat(!paused) + title;
  title = "\u23F8\uFE0F ".repeat(paused) + title;
  title = "\u{1F500} ".repeat(shuffle) + title;
  title = "\u{1F501} ".repeat(replay) + title;
  title = "\u{1F49F} ".repeat(custom) + title;
  document.title = title;
}

function trackDurationForDisplay(index) {
  let displayDuration = Math.max(fullPlaylist[index]["yt_end_s"] - fullPlaylist[index]["yt_start_s"], 0);
  displayDuration += (fullPlaylist[index]["yt_duration_s"] - fullPlaylist[index]["yt_start_s"]) * (displayDuration == 0);
  return displayDuration;
}

function updatePlayedBar() {
  let played_proportion = Math.min(currentTrackElapsed/currentTrackDuration, 1);
  document.getElementById("played_bar").style.width = `${100*played_proportion}%`;
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

function deletePlaylist() {
  playlist = [];
  currentTrackIndex = -1;
  custom = false;
}

function editPlaylist() {
  let index = playlist.indexOf(currentTrackFullPlaylistIndex);
  custom = true;
  if (index > -1) {
    playlist.splice(index, 1);
    if (playlist.length === 0) {
        custom = false;
    }
  } else {
    if (digitLogger) {
      index = Number(digitLogger) % playlist.length;
      playlist.splice(index, 0, currentTrackFullPlaylistIndex);
      currentTrackIndex = index;
    } else {
      playlist.push(currentTrackFullPlaylistIndex);
      currentTrackIndex = playlist.length - 1;
    }
  }
  updateDisplay();
}

function getInsideContainer(containerID, childID) {
    let element = document.getElementById(childID);
    let parent = element ? element.parentNode : {};
    return (parent.id && parent.id === containerID) ? element : {};
}

function updatePlaylistDisplay(clear = false) {
  let div_row;
  let indexDisplay;
  Object.keys(fullPlaylist).forEach(index => {
    div_row = document.getElementById(index);
    indexDisplay = div_row.querySelector("h5");
    div_row.setAttribute("playlist", "false");
    indexDisplay.innerHTML = "0000 |";
  });
  if (!clear) {
    for ([playlistIndex, index] of playlist.entries()) {
      div_row = document.getElementById(index);
      indexDisplay = div_row.querySelector("h5");
      div_row.setAttribute("playlist", "true");
      indexDisplay.innerHTML = `${playlistIndex.toString().padStart(4, '0') + " |"}`;
    }
  }
}