For now, the player can be controlled using keyboard only:
 - Spacebar to pause and play
 - A-D to play previous/next track
 - S-W to lower/increase volume by 5%
 - Q-E to go back/fast-forward 5 seconds
 - M to toggle mute/unmute
 - R to toggle shuffle
 - Any sequence of digits followed by Enter to jump to the track of specified index (modulo the playlist's length)

script.js uses Google's Youtube IFrame API to play a fixed playlist of videos.
spotify_playlist_backup.py uses Spotify's Web API and Google's Youtube Data v3 API to scrape data and generate a non-curated version of the playlist .json file that is then used by script.js.

https://tomobossi.github.io/playlist/