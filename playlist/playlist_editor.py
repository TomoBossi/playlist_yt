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

def disable(df, indexes):
    pass

# Regiones trabajables:
# OSTs jazzeros entre Hotline Miami
# lounge previo al DnB muy desorganizado.
# Edge theme y temas del Trails se sienten medio fuera de lugar entre canciones rápidas
# Hana Valley
# The Fall, Evil Thoughts, MJ-xx y Mental Diving cerca del lounge
# Who can it be now y dos temas de luxury elite fuera de lugar
# Born Slippy en el DnB

# TODO add https://gist.github.com/TomoBossi/58d971fa9e2d666deb275405bb34bbd9
# TODO add func that takes unplayable track index list and removes yt_id automatically, overwrites .json file.

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    df = pd.read_json("playlist.json", orient = "index")
    mode = ["add", "move", "remove", "disable"][4] # safety [4]th

    if mode == "add":
        df = add(df,
            index = 571,
            title = "リサフランク420 / 現代のコンピュー",
            artists = "MACINTOSH PLUS",
            album = "Floral Shoppe",
            yt_id = "pp1NWRDl0pI",
            yt_title = "Ａｅｓｔｈｅｔｉｃ Ｍｅｍｅｓ | 1½ Hour Vaporwave Mix",
            yt_duration_s = 5108,
            yt_start_s = 0,
            yt_end_s = 437,
            volume_multiplier = 1.0,
            album_cover_filename = "vektroid_floral_shoppe.jpg",
        )

    if mode == "move":
        df = move(df, a, a)

    if mode == "remove":
        df = remove(df, a)

    if mode == "disable":
        df = disable(df, [])

    df.to_json("playlist.json", orient = "index")
    # df.to_json("playlist" + datetime.today().strftime("%Y%m%d") + ".json", orient = "index")