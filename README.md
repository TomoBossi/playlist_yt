For now, the player can be controlled using keyboard only:
 - A-D to play previous/next track
 - S-W to lower/increase volume by 5%
 - Q-E to go back/fast-forward 5 seconds
 - R to restart the currently playing track
 - Spacebar to toggle pause
 - M to toggle mute
 - X to toggle replay
 - Z to toggle shuffle
 - Any sequence of digits followed by Period (.) to jump to the fraction of the track specified by the sequence
 - Any sequence of digits followed by Enter to jump to the track of index specified by the sequence

script.js uses Google's Youtube IFrame API to play a fixed playlist of videos.
spotify_playlist_backup.py uses Spotify's Web API and Google's Youtube Data v3 API to scrape data and generate a non-curated version of the playlist .json file that is then used by script.js.

https://tomobossi.github.io/playlist/