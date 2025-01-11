import pandas as pd

def generate_partial_uid(row):
    # if "uid" in row and not pd.isna(row["uid"]):
    #     return row["uid"]
    uid = ''.join(letter for letter in [word[0] for word in row["artists"].split(",")[0].split(" ") if word != ""] if letter.isupper() or letter.isdigit())
    uid += ''.join(letter for letter in [word[0] for word in row["album"].split(",")[0].split(" ") if word != ""] if letter.isupper() or letter.isdigit())
    uid += ''.join(letter for letter in [word[0] for word in row["title"].split(",")[0].split(" ") if word != ""] if letter.isupper() or letter.isdigit())
    return uid

def generate_default_uids(d):
    uid_counter = {}
    for row in d:
        main_artist = row["artists"].split(",")[0]
        if main_artist not in uid_counter:
            uid_counter[main_artist] = {}
        if row["album"] not in uid_counter[main_artist]:
            uid_counter[main_artist][row["album"]] = 0
        else:
            uid_counter[main_artist][row["album"]] += 1
        row["uid"] = generate_partial_uid(row) # + str(uid_counter[main_artist][row["album"]])

if __name__ == "__main__":
    import os
    os.chdir(os.path.dirname(__file__))
    df = pd.read_json("playlist.json", orient = "index").to_dict('records')
    
    # generate_default_uids(df)

    uids = []
    for row in df:
        uid = row["uid"]
        if uid in uids and uid[:2] != "__":
            print(f"Conflict on uid {uid}, song {row["title"]} vs song {df[uids.index(uid)]["title"]}")
        uids.append(uid)

    # df = pd.DataFrame(df)
    # df.to_json("playlist_uids.json", orient = "index")