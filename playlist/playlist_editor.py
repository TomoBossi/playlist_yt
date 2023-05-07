import os
import pandas as pd

def add(df,
        index, 
        title, 
        artists, 
        album, 
        yt_id, 
        yt_title, 
        yt_duration_s, 
        album_cover_filename, 
        yt_start_s = 0, 
        yt_end_s = 0,
        volume_multiplier = 1.0):
    df.loc[index - 0.5] = [
        title, 
        artists, 
        album,
        "",
        "",
        "",
        "",
        yt_id,
        yt_title,
        yt_duration_s,
        yt_start_s,
        yt_end_s,
        volume_multiplier,
        album_cover_filename]
    df = df.sort_index().reset_index(drop=True)
    return df

def remove(df, index):
    df = df.drop(index)
    df = df.sort_index().reset_index(drop=True)
    return df

def move(df, origin, destination):
    row = df.loc[origin]
    df = df.drop(origin)
    df.loc[destination + 0.5] = row
    df = df.sort_index().reset_index(drop=True)
    return df

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    df = pd.read_json("playlist.json", orient = "index")
    mode = ["add", "move", "remove"][3] # safety [3]rd

    if mode == "add":
        df = add(df, 
                index = 0,
                title = "title", 
                artists = "artists", 
                album = "album",
                yt_id = "yt_id",
                yt_title = "yt_title",
                yt_duration_s = 0,
                yt_start_s = 0,
                yt_end_s = 0,
                volume_multiplier = 1.0,
                album_cover_filename = "filename.jpg")

    if mode == "move":
        df = move(df, 0, 1)

    if mode == "remove":
        df = remove(df, 0)

    df.to_json("playlist.json", orient = "index")
    # df.to_json("playlist" + datetime.today().strftime("%Y%m%d") + ".json", orient = "index")