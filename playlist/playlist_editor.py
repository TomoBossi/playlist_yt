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
    for idx in indexes:
        yt_id = df.loc[idx]["yt_id"]
        if yt_id:
            df.at[idx, "yt_title"] = yt_id + " " + df.loc[idx]["yt_title"]
            df.at[idx, "yt_id"] = ""
    return df

# Regiones trabajables:
# OSTs jazzeros entre Hotline Miami
# lounge previo al DnB muy desorganizado.
# Edge theme y temas del Trails se sienten medio fuera de lugar entre canciones rápidas
# Hana Valley
# The Fall, Evil Thoughts, MJ-xx y Mental Diving cerca del lounge
# Who can it be now y dos temas de luxury elite fuera de lugar
# Born Slippy en el DnB
# TODO add https://gist.github.com/TomoBossi/58d971fa9e2d666deb275405bb34bbd9
# TODO add https://open.spotify.com/collection/tracks

if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(__file__))
    df = pd.read_json("playlist.json", orient = "index")
    mode = ["add", "move", "remove", "disable"][4] # safety [4]th

    if mode == "add":
        df = add(df,
            index = 310,
            title = "Everybody Knows",
            artists = "Leonard Cohen",
            album = "I'm Your Man",
            yt_id = "Gxd23UVID7k",
            yt_title = "Leonard Cohen - Everybody Knows (Audio)",
            yt_duration_s = 337,
            yt_start_s = 0,
            yt_end_s = 0,
            volume_multiplier = 1.0,
            album_cover_filename = "your_man.jpg",
        )

    if mode == "move":
        df = move(df, _, _)

    if mode == "remove":
        df = remove(df, _)

    if mode == "disable":
        df = disable(df, [])

    df.to_json("playlist.json", orient = "index")
    # df.to_json("playlist" + datetime.today().strftime("%Y%m%d") + ".json", orient = "index")