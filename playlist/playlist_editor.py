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

def move(df, origin, destination):
    row = df.loc[origin]
    df = df.drop(origin)
    df.loc[destination - 0.5] = row
    df = df.sort_index().reset_index(drop=True)
    return df

def remove(df, index):
    df = df.drop(index)
    df = df.reset_index(drop=True)
    return df

# Regiones trabajables: OSTs jazzeros entre Hotline Miami, lounge previo al DnB muy desorganizado.
# Yuyos incomodos: Hana Valley, The Fall y Mental Diving cerca del lounge, Who can it be now.

# TODO debug para, desde la consola, recorrer todas las canciones
# chequeando existencia (thumbnail hack) y/o reproducibilidad (eventual status == "PLAYING")

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    df = pd.read_json("playlist.json", orient = "index")
    mode = ["add", "move", "remove"][3] # safety [3]rd

    if mode == "add":
        df = add(df, 
            index = 547,
            title = "Better (The Whispers - I Can Make It Better; James Brown - There It Is)",
            artists = "SAINT PEPSI",
            album = "Hit Vibes",
            yt_id = "WYvji5AXOfk",
            yt_title = "SAINT PEPSI - Better",
            yt_duration_s = 234,
            yt_start_s = 0,
            yt_end_s = 0,
            volume_multiplier = 1.0,
            album_cover_filename = "saint_pepsi_cherry_pepsi_better_alt1.jpg",
        )

    if mode == "move":
        df = move(df, 515, 541)

    if mode == "remove":
        df = remove(df, a)

    df.to_json("playlist.json", orient = "index")
    # df.to_json("playlist" + datetime.today().strftime("%Y%m%d") + ".json", orient = "index")