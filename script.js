// Playlist in JSON format. Hidden videos don't work.
var playlist = {
  0: { id: "F4Ec98UJXfA", start: 0, end: 0 },
  1: { id: "eE6f_KG1flI", start: 0, end: 0 },
  2: { id: "1-ACA6Hh85w", start: 815, end: 815 + 342 },
  3: { id: "1RyDuyjgd2Q", start: 0, end: 0 }
};

var playlistLength = Object.keys(playlist).length;
var currentTrackIndex = 0;
var currentTrack = playlist[currentTrackIndex];
var currentVolume = 100;

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
  player.playVideo();
}

function playIndex(index) {
  currentTrack = playlist[index];
  player.loadVideoById({
    videoId: currentTrack["id"],
    startSeconds: currentTrack["start"],
    endSeconds: currentTrack["end"]
  });
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

var state = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2
};

function onPlayerStateChange(event) {
  if (player.getPlayerState() == state["ENDED"]) {
    playNext();
  }
}

function changeVolume(volumeDelta) {
  currentVolume = Math.min(Math.max(currentVolume + volumeDelta, 0), 100);
  player.setVolume(currentVolume);
}

function playerExists() {
  return typeof player != "undefined";
}

// Keyboard event listeners
document.addEventListener(
  "keypress",
  (event) => {
    // console.log(event.code);
    // console.log(event.keyCode);
    if (playerAPIisReady) {
      switch (event.keyCode) {
        case 32: // Space
          if (player.getPlayerState() == state["PLAYING"]) {
            player.pauseVideo();
          } else {
            player.playVideo();
          }
        case 119: // W
          changeVolume(5);
          break;
        case 97: // A
          playPrev();
          break;
        case 115: // S
          changeVolume(-5);
          break;
        case 100: // D
          playNext();
          break;
        case 113: // Q
          skip(-5);
          break;
        case 101: // E
          skip(5);
          break;
      }
    }
  },
  false
);
