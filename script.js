// Playlist in JSON format. Hidden videos don't work.
var playlist = {
  0: { yt_id: "F4Ec98UJXfA", yt_start_s: 0, yt_end_s: 0, volume_multiplier: 0.7 },
  1: { yt_id: "eE6f_KG1flI", yt_start_s: 0, yt_end_s: 0, volume_multiplier: 0.8 },
  2: { yt_id: "1-ACA6Hh85w", yt_start_s: 815, yt_end_s: 815 + 342, volume_multiplier: 0.9 },
  3: { yt_id: "1RyDuyjgd2Q", yt_start_s: 0, yt_end_s: 0, volume_multiplier: 1.0 }
};

var playlistLength = Object.keys(playlist).length;
var currentTrackIndex = 0;
var currentTrack = playlist[currentTrackIndex];
var currentVolume = 100;
var muted = false;
var digitLogger = ""

var playerState = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2
};

// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
// This function flags the API as ready once it downloads, and also creates the player.
var player;
var playerAPIisReady = false;
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
  playIndex(currentTrackIndex);
}

function playPrev() {
  currentTrackIndex += playlistLength - 1;
  currentTrackIndex %= playlistLength;
  playIndex(currentTrackIndex);
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

function onPlayerStateChange(event) {
  if (player.getPlayerState() == playerState["ENDED"]) {
    playNext();
  }
}

function changeVolume(volumeDelta = 0, muted = false) {
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
          if (digitLogger) {
            currentTrackIndex = Number(digitLogger);
            currentTrackIndex %= playlistLength;
            playIndex(currentTrackIndex);
          }
          break;
        case "Space":
          if (player.getPlayerState() == playerState["PLAYING"]) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
          break;
        case "KeyM":
          muted = !muted;
          changeVolume(0, muted);
          break;
        case "KeyW":
          muted = false;
          changeVolume(5);
          break;
        case "KeyA":
          playPrev();
          break;
        case "KeyS":
          muted = false;
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
      }
      updateDigitLogger(event.key);
    }
  },
  false
);

// https://gist.github.com/tonY1883/a3b85925081688de569b779b4657439b
function validVideoId(yt_id) {
  var img = new Image();
  img.src = "http://img.youtube.com/vi/" + yt_id + "/mqdefault.jpg";
  img.onload = function () {
    // HACK a mq thumbnail has (in almost every case) width of 320.
    // If the video does not exist (therefore thumbnail doesn't exist), a default thumbnail of 120 width is returned.
    // Function returns true for private videos, which can't be played by the API.
    var valid = !(img.width === 120);
    console.log(valid);
    if (valid) {
      // Here will eventually go code that visually and/or functionally disables the track/"removes" it from the playlist.
    }
  }
}

function updateDigitLogger(key) {
  if (!(isNaN(Number(key)) || key === null || key === ' ')) {
    digitLogger += key;
  } else {
    digitLogger = "";
  }
}