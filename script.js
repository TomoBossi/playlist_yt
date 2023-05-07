// Inner logic / Backend

window.mobileCheck = function() {
  // https://stackoverflow.com/a/11381730/14067090
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

const isMobile = window.mobileCheck();
const randomStarterTrack = !isMobile;
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
  if (isMobile) {currentTrackIndex = playlistLength - 1;} // Temp
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