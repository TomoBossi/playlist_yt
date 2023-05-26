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

# Regiones trabajables: OSTs jazzeros entre Hotline Miami, lounge previo al DnB muy desorganizado.
# Edge theme y temas del Trails se sienten medio fuera de lugar entre canciones rápidas
# Yuyos incomodos: Hana Valley, The Fall, Evil Thoughts, MJ-xx y Mental Diving cerca del lounge, Who can it be now y dos temas de luxury elite.

# TODO add https://gist.github.com/TomoBossi/58d971fa9e2d666deb275405bb34bbd9
# TODO add func that takes unplayable track index list and removes yt_id automatically, overwrites .json file.

if __name__ == "__main__":
    os.chdir(os.path.dirname(__file__))
    df = pd.read_json("playlist.json", orient = "index")
    mode = ["add", "move", "remove", "disable"][0] # safety [4]th

    if mode == "add":
        df = add(df,
            index = 403,
            title = "Still, Move Forward!",
            artists = "Kenji Hiramatsu",
            album = "Xenoblade Chronicles 2 OST",
            yt_id = "512pcIZOjm0",
            yt_title = "Still, Move Forward! (Combat Theme 3) - Xenoblade Chronicles 2 OST [078]",
            yt_duration_s = 383,
            yt_start_s = 0,
            yt_end_s = 0,
            volume_multiplier = 1.0,
            album_cover_filename = "xenoblade_chronicles_2_ost.jpg",
        )

    if mode == "move":
        df = move(df, 515, 541)

    if mode == "remove":
        df = remove(df, a)

    if mode == "disable":
        df = disable(df, [])

    df.to_json("playlist.json", orient = "index")
    # df.to_json("playlist" + datetime.today().strftime("%Y%m%d") + ".json", orient = "index")