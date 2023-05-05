// Inner logic / Backend

const randomStarterTrack = true;
var prevTrack
var playerAPIready = false;
var currentTrackDuration = 0;
var currentTrackElapsed = 0;
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

const playerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
};

init();

async function init() {
  const res = await fetch("playlist/dementiawave20230503_curated.json");
  playlist = await res.json();
  playlistLength = Object.keys(playlist).length;
  currentTrackIndex = randomIndex() * randomStarterTrack;
  currentTrack = playlist[currentTrackIndex];
  // This code loads the IFrame Player API code asynchronously
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// This function flags the API as ready and creates the player
// Triggers once the API has fully downloaded
function onYouTubeIframeAPIReady() {
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
  trackElapsedTime();
  player.setVolume(currentVolume);
  playIndex(currentTrackIndex);
}

function trackElapsedTime() {
  // https://stackoverflow.com/a/39160557
  setInterval(() => {
    currentTrackElapsed = player.getCurrentTime() - currentTrack["yt_start_s"];
  }, 
  100);
}

function onPlayerStateChange(event) {
  if (player.getPlayerState() == playerState["ENDED"]) {
    playNext();
  }
  updateCurrentTrackDuration();
}

function tryNext(event) {
  setTimeout(() => {
    replay = false;
    playNext();
  }, 
  10);
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
  updateDisplay(); // Unsettling
}

function playNext() {
  playIndex(movedIndex(1));
}

function playPrev() {
  playIndex(movedIndex(-1));
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
  if (player.getPlayerState() == playerState["PLAYING"]) {
    player.pauseVideo();
    paused = true;
  } else if (player.getPlayerState() == playerState["PAUSED"]) {
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
    replay = false;
    muted = false;
    playIndex(Number(digitLogger % playlistLength));
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
  currentTrackDuration += (player.getDuration() - currentTrack["yt_start_s"])*(currentTrackDuration == 0);
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
    callback(!(img.width === 120));
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
          playPrev();
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

function updateDisplay() {
  if (playerAPIready) {
    updateTitle();
  }
}

function updateTitle() {
  var title = currentTrack["title"] + " - " + currentTrack["artists"] 
  title += " | \u{1F50A}" + currentVolume + "%";
  title = "\u23F5 ".repeat(!paused) + title
  title = "\u23F8 ".repeat(paused) + title
  title = "\u{1F507} ".repeat(muted) + title
  title = "\u{1F500} ".repeat(shuffle) + title
  title = "\u{1F501} ".repeat(replay) + title
  document.title = title;
}

function trackDurationForDisplay(index) {
  var displayDuration = Math.max(playlist[index]["yt_end_s"] - playlist[index]["yt_start_s"], 0);
  displayDuration += (playlist[index]["yt_duration_s"] - playlist[index]["yt_start_s"])*(displayDuration == 0);
  return displayDuration;
}