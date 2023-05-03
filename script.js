// Playlist in JSON format. Hidden videos don't work.
var playlist = {
  0: { id: "F4Ec98UJXfA", start: 0, end: 0, volume_multiplier: 0.7 },
  1: { id: "eE6f_KG1flI", start: 0, end: 0, volume_multiplier: 0.8 },
  2: { id: "1-ACA6Hh85w", start: 815, end: 815 + 342, volume_multiplier: 0.9 },
  3: { id: "1RyDuyjgd2Q", start: 0, end: 0, volume_multiplier: 1.0 }
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
  createPlayer(initTrackId(currentTrack));
}

function createPlayer(id) {
  player = new YT.Player("player", {
    videoId: id,
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
    videoId: currentTrack["id"],
    startSeconds: currentTrack["start"],
    endSeconds: currentTrack["end"]
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
  time = Math.max(currentTrack["start"], time);
  if (currentTrack["end"]) {
    time = Math.min(currentTrack["end"], time);
    if (time == currentTrack["end"]) {
      playNext();
    }
  }
  player.seekTo(parseInt(time));
}

function initTrackId(track) {
  return track["id"] + "?start=" + track["start"] + "&end=" + track["end"];
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
function validVideoId(id) {
  var img = new Image();
  img.src = "http://img.youtube.com/vi/" + id + "/mqdefault.jpg";
  img.onload = function() {
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