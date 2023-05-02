import os
import json
import spotipy
import requests
import urllib.request
import pandas as pd
from time import sleep
from datetime import datetime
from googleapiclient.discovery import build

yt_api_key = os.environ["YOUTUBE_DATA_API_KEY"]
sp_client_id = os.environ["SPOTIPY_CLIENT_ID"]
sp_client_secret = os.environ["SPOTIPY_CLIENT_SECRET"]

yt = build("youtube", "v3", developerKey = yt_api_key)
sp_credentials = spotipy.oauth2.SpotifyClientCredentials(sp_client_id, sp_client_secret)
sp = spotipy.Spotify(client_credentials_manager = sp_credentials)

def playlist_backup(user_id, playlist_id, find_best_yt_match = False, cover_art_save_dir = ""):
    playlist = sp.user_playlist_tracks(user_id, playlist_id)
    playlist_items = playlist["items"]
    df = pd.DataFrame(columns = ["title", 
                                 "artists" , 
                                 "album", 
                                 "sp_datetime_added", 
                                 "sp_duration_s", 
                                 "sp_track_URI", 
                                 "sp_album_URI", 
                                 "yt_id",
                                 "yt_title",
                                 "yt_duration_s",
                                 "yt_start_s",
                                 "yt_end_s",
                                 "album_cover_filename"])
    while playlist["next"]:
        playlist = sp.next(playlist)
        playlist_items.extend(playlist["items"])
    for element in playlist_items:
        title = element["track"]["name"]
        album = element["track"]["album"]["name"]
        artists = ", ".join([artist["name"] for artist in element["track"]["artists"]])
        sp_duration_s = int(float(element["track"]["duration_ms"])/1000)
        sp_album_URI = element["track"]["album"]["uri"]
        yt_id, yt_title, yt_duration_s = "", "", 0
        if find_best_yt_match:
            yt_id, yt_title, yt_duration_s = yt_search_video_get_data(title, artists)
            sleep(1)
        album_filename = sp_album_URI.split(":")[-1] + "_" + clean_filename(album) + ".jpg"
        if cover_art_save_dir: save_cover(element, cover_art_save_dir, album_filename)
        df.loc[len(df)] = [title,                   # title
                           artists,                 # artists
                           album,                   # album
                           element["added_at"],     # sp_datetime_added
                           sp_duration_s,           # sp_duration_s
                           element["track"]["uri"], # sp_track_URI
                           sp_album_URI,            # sp_album_URI
                           yt_id,                   # yt_id
                           yt_title,                # yt_title
                           yt_duration_s,           # yt_duration_s
                           0,                       # yt_start_s
                           0,                       # yt_end_s
                           album_filename,]         # album_cover_filename
    return df

def save_cover(playlist_element, save_dir, album_filename):
    cover_url = playlist_element["track"]["album"]["images"][0]["url"] # First image ([0]) is always largest
    full_save_path = os.path.join(save_dir, album_filename)
    if not os.path.isfile(full_save_path):
        response = requests.get(cover_url)
        with open(full_save_path, "wb") as f:
            f.write(response.content)

def clean_filename(filename):
    replacer_map = {"#": "no.", "%": "percent", "&": "and", "{": "(", "}": ")", "\\": "-", "<": "(", ">": ")", "*": "X", "?": "", "!": "", "$": "", " ": "_", "/": "-", "'": "", '"': "", ":": "_-", "@": "at", "+": "plus", "|": "-", "=": "equals", "`": "",}
    for symbol in replacer_map.keys():
        filename = filename.replace(symbol, replacer_map[symbol])
    return filename

def yt_search_video_get_data(title: str, artists: str):
    video = yt_search_video(title, artists)
    return yt_video_data(video)

def yt_search_video(title: str, artists: str):
    query = " - ".join([title, artists])
    request_video = yt.search().list(part = "snippet", maxResults = 1, q = query)
    response_video = request_video.execute()["items"][0]
    return response_video

def yt_video_data(video):
    result_id = video["id"]["videoId"]
    result_title = video["snippet"]["title"]
    result_duration = yt_video_duration_from_id(result_id)
    return result_id, result_title, result_duration

def yt_video_duration_from_id(video_id: str) -> int:
    request_duration = "https://www.googleapis.com/youtube/v3/videos?id=" + video_id + "&key=" + yt_api_key + "&part=contentDetails"
    with urllib.request.urlopen(request_duration) as url:
        response_duration = json.loads(url.read())
    return parse_duration(response_duration["items"][0]["contentDetails"]["duration"])

def parse_duration(yt_video_duration: str) -> int: # "PT2H12M40S"
    res = []
    prev_is_digit = False
    for char in yt_video_duration:
      if char.isdigit():
        if prev_is_digit:
          res[-1] = res[-1] + char
        else:
          res.append(char)
        prev_is_digit = True
      else:
        prev_is_digit = False
    return sum([60**idx * int(num) for idx, num in enumerate(res[::-1])])

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    df = playlist_backup("n58k0fnejbizfknk4i4m76mkt", 
                         "2YvcU4kgVHhFSQSmbO6cUS", 
                         find_best_yt_match = False,
                         cover_art_save_dir = "../images/cover_art/")
    df.to_json("dementiawave" + datetime.today().strftime('%Y%m%d') + ".json", orient = "split")

""" 
https://spotipy.readthedocs.io/en/2.22.1/
https://www.youtube.com/watch?v=3RGm4jALukM
https://github.com/spotipy-dev/spotipy/issues/246#issuecomment-891805828
https://developer.spotify.com/dashboard/2bbe2fd984d5441f96de1cb006841db7/settings
https://unix.stackexchange.com/questions/117467/how-to-permanently-set-environmental-variables (.bashrc)
 
export SPOTIPY_CLIENT_ID=2bbe2fd984d5441f96de1cb006841db7
export SPOTIPY_CLIENT_SECRET=...
export SPOTIPY_REDIRECT_URI=https://localhost:8888/callback
 
Example of element in playlist_items:
{'added_at': '2021-09-16T23:18:40Z', 
 'added_by': {'external_urls': {'spotify': 'https://open.spotify.com/user/n58k0fnejbizfknk4i4m76mkt'}, 
              'href': 'https://api.spotify.com/v1/users/n58k0fnejbizfknk4i4m76mkt', 
              'id': 'n58k0fnejbizfknk4i4m76mkt', 
              'type': 'user', 
              'uri': 'spotify:user:n58k0fnejbizfknk4i4m76mkt'}, 
 'is_local': False, 
 'primary_color': None, 
 'track': {'album': {'album_group': 'album', 
                     'album_type': 'album', 
                     'artists': [{'external_urls': {'spotify': 'https://open.spotify.com/artist/7M1FPw29m5FbicYzS2xdpi'}, 
                                 'href': 'https://api.spotify.com/v1/artists/7M1FPw29m5FbicYzS2xdpi', 
                                 'id': '7M1FPw29m5FbicYzS2xdpi', 
                                 'name': 'King Crimson', 
                                 'type': 'artist', 
                                 'uri': 'spotify:artist:7M1FPw29m5FbicYzS2xdpi'}],
                     'available_markets': [], 
                     'external_urls': {'spotify': 'https://open.spotify.com/album/5wec5BciMpDMzlEFpYeHse'}, 
                     'href': 'https://api.spotify.com/v1/albums/5wec5BciMpDMzlEFpYeHse', 
                     'id': '5wec5BciMpDMzlEFpYeHse', 
                     'images': [{'height': 640, 
                                 'url': 'https://i.scdn.co/image/ab67616d0000b2739f2179592d196f575b7a0ff5', 
                                 'width': 640}, 
                                {'height': 300, 
                                 'url': 'https://i.scdn.co/image/ab67616d00001e029f2179592d196f575b7a0ff5', 
                                 'width': 300}, 
                                {'height': 64, 
                                 'url': 'https://i.scdn.co/image/ab67616d000048519f2179592d196f575b7a0ff5', 
                                 'width': 64}],
                     'is_playable': True, 
                     'name': 'In The Court Of The Crimson King (Expanded & Remastered Original Album Mix)', 
                     'release_date': '1969-10-10', 
                     'release_date_precision': 'day', 
                     'total_tracks': 8, 
                     'type': 'album', 
                     'uri': 'spotify:album:5wec5BciMpDMzlEFpYeHse'}, 
           'artists': [{'external_urls': {'spotify': 'https://open.spotify.com/artist/7M1FPw29m5FbicYzS2xdpi'}, 
                       'href': 'https://api.spotify.com/v1/artists/7M1FPw29m5FbicYzS2xdpi', 
                       'id': '7M1FPw29m5FbicYzS2xdpi', 
                       'name': 'King Crimson', 
                       'type': 'artist', 
                       'uri': 'spotify:artist:7M1FPw29m5FbicYzS2xdpi'}], 
           'available_markets': [], 
           'disc_number': 1, 
           'duration_ms': 442580, 
           'episode': False, 
           'explicit': False, 
           'external_ids': {'isrc': 'GBCTX1400800'}, 
           'external_urls': {'spotify': 'https://open.spotify.com/track/5yClziwiwTdqRmdPQl3NDz'}, 
           'href': 'https://api.spotify.com/v1/tracks/5yClziwiwTdqRmdPQl3NDz', 
           'id': '5yClziwiwTdqRmdPQl3NDz', 
           'is_local': False, 
           'name': '21st Century Schizoid Man', 
           'popularity': 0, 
           'preview_url': None, 
           'track': True, 
           'track_number': 1, 
           'type': 'track', 
           'uri': 'spotify:track:5yClziwiwTdqRmdPQl3NDz'},
 'video_thumbnail': {'url': None}}
 
If multiple artists per track, element["track"]["artists"] looks like so:
'artists': [{'external_urls': {'spotify': 'https://open.spotify.com/artist/29XOeO6KIWxGthejQqn793'}, 
                              'href': 'https://api.spotify.com/v1/artists/29XOeO6KIWxGthejQqn793', 
                              'id': '29XOeO6KIWxGthejQqn793', 
                              'name': 'Flying Lotus', 
                              'type': 'artist', 
                              'uri': 'spotify:artist:29XOeO6KIWxGthejQqn793'}, 
            {'external_urls': {'spotify': 'https://open.spotify.com/artist/4CvTDPKA6W06DRfBnZKrau'}, 
                              'href': 'https://api.spotify.com/v1/artists/4CvTDPKA6W06DRfBnZKrau', 
                              'id': '4CvTDPKA6W06DRfBnZKrau', 
                              'name': 'Thom Yorke', 
                              'type': 'artist', 
                              'uri': 'spotify:artist:4CvTDPKA6W06DRfBnZKrau'}]

https://googleapis.github.io/google-api-python-client/docs/dyn/youtube_v3.html
https://www.youtube.com/watch?v=th5_9woFJmk
https://console.cloud.google.com/apis/credentials?project=youtube-data-scrapper-385514

export YOUTUBE_DATA_API_KEY=...

Example video response (maxResults = 1):
{'kind': 'youtube#searchListResponse',
 'etag': 'L4_N9dRuBi4DB7b1helJLQj5rNg',
 'nextPageToken': 'CAEQAA',
 'regionCode': 'AR',
 'pageInfo': {'totalResults': 1000000,
              'resultsPerPage': 1},
 'items': [{'kind': 'youtube#searchResult',
            'etag': 'bMKyCwsb1kK4OCbwNptDshVP3vE',
            'id': {'kind': 'youtube#video',
                   'videoId': 'UlKrH07au6E'},
            'snippet': {'publishedAt': '2020-12-17T10:00:07Z', 
                        'channelId': 'UCBxEf1UWDjbIEoh2MAQR7zQ', 
                        'title': 'King Crimson - I Talk To The Wind', 
                        'description': "I TALK TO THE WIND (McDonald, Sinfield) Said the straight man to the late man Where have you been I've been here and I've ...", 
                        'thumbnails': {'default': {'url': 'https://i.ytimg.com/vi/UlKrH07au6E/default.jpg', 
                                                  'width': 120, 
                                                  'height': 90}, 
                                      'medium': {'url': 'https://i.ytimg.com/vi/UlKrH07au6E/mqdefault.jpg', 
                                                  'width': 320, 
                                                  'height': 180}, 
                                      'high': {'url': 'https://i.ytimg.com/vi/UlKrH07au6E/hqdefault.jpg', 
                                                'width': 480, 
                                                'height': 360}}, 
                        'channelTitle': 'King Crimson', 
                        'liveBroadcastContent': 'none', 
                        'publishTime': '2020-12-17T10:00:07Z'}}]}
"""