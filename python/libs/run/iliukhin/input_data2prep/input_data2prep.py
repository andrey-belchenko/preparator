import pandas as pd
from pymongo import MongoClient
import yaml
import os
import re
from transform import transform_rs, transform_supa
from run.utils import yandex_disk


with open("params.yml", "r", encoding="UTF-8") as f:
    params = yaml.full_load(f)

connection = MongoClient(params["mongo_connection"])

def insert_collection(db_name, col_name, df):
    db = connection[db_name]
    db.drop_collection(col_name)
    col = db[col_name]
    col.insert_many(df.to_dict("records"))
    print(f"{col_name} collection inserted into {db_name} database")

folder = r"C:\Users\andre\YandexDisk\МРСК\Разное\Пример данных для загрузки\siberia"

def insert_collection(db_name, col_name, df):
    db = connection[db_name]
    db.drop_collection(col_name)
    col = db[col_name]
    col.insert_many(df.to_dict("records"))
    print(f"{col_name} collection inserted into {db_name} database")


def load_supa_file(file_name, db_name, col_name):
    path = os.path.join(folder, file_name)
    df = transform_supa(path)
    insert_collection(db_name, col_name, df)


def load_rs_file(file_name, db_name, col_name, equip_class, columns2rename):
    path = os.path.join(folder, file_name)
    df = transform_rs(path, equip_class, columns2rename)
    insert_collection(db_name, col_name, df)


load_supa_file("Substation_supa.xlsx", "bav_test_Substation", "Substation_supa")
load_rs_file(
    "Substation_rs.csv",
    "bav_test_Substation",
    "Substation_rs",
    "Substation",
    {
        "IRI": "Uid",
        "name": "name",
        "Класс": "Класс",
        "Region": "Substations",
    },
)
