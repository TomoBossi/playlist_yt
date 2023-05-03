var playerAPIisReady = false;
var currentTrackIndex = 0;
var currentVolume = 100;
var shuffle = false;
var muted = false;
var digitLogger = "";
var playlistLength;
var currentTrack;
var playlist;
var player;

const playerState = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2
};

init();

async function init() {
  const res = await fetch("playlist/dementiawave20230503_curated.json");
  playlist = await res.json();
  playlistLength = Object.keys(playlist).length;
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
  playerAPIisReady = true;
  player = new YT.Player("player", {
    videoId: "",
    height: "0",
    width: "0",
    playerVars: {
      playsinline: 1
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  player.setVolume(currentVolume);
  playIndex(currentTrackIndex);
}

function onPlayerStateChange(event) {
  if (player.getPlayerState() == playerState["ENDED"]) {
    playNext();
  }
}

function playIndex(index) {
  currentTrack = playlist[index];
  player.loadVideoById({
    videoId: currentTrack["yt_id"],
    startSeconds: currentTrack["yt_start_s"],
    endSeconds: currentTrack["yt_end_s"]
  });
  changeVolume();
}

function playNext() {
  currentTrackIndex++;
  currentTrackIndex %= playlistLength;
  if (shuffle) {
    currentTrackIndex = Math.floor(Math.random() * (playlistLength + 1));
  }
  playIndex(currentTrackIndex);
}

function playPrev() {
  currentTrackIndex += playlistLength - 1;
  currentTrackIndex %= playlistLength;
  if (shuffle) {
    currentTrackIndex = Math.floor(Math.random() * (playlistLength + 1));
  }
  playIndex(currentTrackIndex);
}

function playLogged() {
  if (digitLogger) {
    currentTrackIndex = Number(digitLogger);
    currentTrackIndex %= playlistLength;
    playIndex(currentTrackIndex);
  }
}

function pause() {
  if (player.getPlayerState() == playerState["PLAYING"]) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function skip(seconds) {
  var time = player.getCurrentTime() + seconds;
  time = Math.max(currentTrack["yt_start_s"], time);
  if (currentTrack["yt_end_s"]) {
    time = Math.min(currentTrack["yt_end_s"], time);
    if (time == currentTrack["yt_end_s"]) {
      playNext();
    }
  }
  player.seekTo(parseInt(time));
}

function changeVolume(volumeDelta = 0, mute = false) {
  muted = mute;
  currentVolume = Math.min(Math.max(currentVolume + volumeDelta, 0), 100);
  player.setVolume(currentVolume * currentTrack["volume_multiplier"] * !muted);
}

function playerExists() {
  return typeof player != "undefined";
}

// Keyboard event listeners
document.addEventListener(
  "keypress",
  (event) => {
    // console.log(event.key);
    // console.log(event.code);
    if (playerAPIisReady) {
      switch (event.code) {
        case "Enter":
          playLogged();
          break;
        case "Space":
          pause();
          break;
        case "KeyM":
          changeVolume(0, mute = !muted);
          break;
        case "KeyW":
          changeVolume(5);
          break;
        case "KeyA":
          playPrev();
          break;
        case "KeyS":
          changeVolume(-5);
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
        case "KeyR":
          shuffle = !shuffle;
          break;
      }
      updateDigitLogger(event.key);
    }
  },
  false
);

function updateDigitLogger(key) {
  if (!(isNaN(Number(key)) || key === null || key === ' ')) {
    digitLogger += key;
  } else {
    digitLogger = "";
  }
}

function validVideoId(yt_id) {
  // https://gist.github.com/tonY1883/a3b85925081688de569b779b4657439b
  var img = new Image();
  img.src = "http://img.youtube.com/vi/" + yt_id + "/mqdefault.jpg";
  img.onload = function () {
    var valid = !(img.width === 120);
    console.log(valid);
    if (valid) {}
  }
}