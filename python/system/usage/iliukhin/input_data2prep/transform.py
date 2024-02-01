import pandas as pd
import re


def clear_iri(text):
    match = re.findall("#.*", text)
    if match:
        res = match[0].replace('"', "").replace("#", "")
        return res


def transform_rs(io, equip_class, columns2rename):
    df = pd.read_csv(io, sep=";")

    if equip_class == "PowerTransformer":
        df = df[~df["_id|R-Equ"].isnull()]

    if equip_class == "Substation":
        df["Класс"] = "Substation"
        for col in ["name", "Region"]:
            df[col] = df[col].apply(
                lambda x: x.replace('"', "").replace("=", "")
                if isinstance(x, str)
                else ""
            )
        df["IRI"] = df["IRI"].apply(clear_iri)

    if equip_class == "VoltageLevel":
        for col in columns2rename.keys():
            if columns2rename[col] == "name":
                # Фильтруем РУ RS без нейтрали, т.к. в supa только РУ
                df = df[~((df[col].str.contains("ейтраль")) | (df[col] == "0"))]

    df = df[columns2rename.keys()]
    df = df.rename(columns=columns2rename)
    df = df.drop_duplicates()
    return df


def transform_supa(io):
    df = pd.read_excel(io)
    cols2rename = {}
    for col in df.columns:
        cols2rename[col] = col.replace(".", "_")
    df = df.rename(columns=cols2rename)
    df = df.replace({pd.NaT: None})
    return df
