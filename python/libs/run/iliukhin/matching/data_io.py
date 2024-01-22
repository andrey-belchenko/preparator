import pandas as pd
from pymongo import MongoClient


def load_data_from_db(class_name, params):
    connection = MongoClient(params['mongo_connection'])
    db_name = params[class_name]['database']
    input_collections_params = params[class_name]['input_collections']

    db = connection[db_name]

    dfs = []

    if 'RS' in input_collections_params:
        df_rs = pd.DataFrame(list(db[input_collections_params['RS']].find()))
        dfs.append(df_rs)

    if 'SUPA' in input_collections_params:
        df_supa = pd.DataFrame(list(db[input_collections_params['SUPA']].find()))
        dfs.append(df_supa)

    if 'extra_data' in input_collections_params:
        Substation_db_name = input_collections_params['extra_data']['database']
        Substation_matched_collection_name = input_collections_params['extra_data']['collection']
        db_Substation_matched = connection[Substation_db_name]
        df_substations_matched = pd.DataFrame(list(db_Substation_matched[Substation_matched_collection_name].find()))
        dfs.append(df_substations_matched)

    connection.close()
    return dfs

def insert_collection_into_db(class_name, params, collection_name, df):
    connection = MongoClient(params['mongo_connection'])
    db_name = params[class_name]['database']
    df = df.replace({pd.NaT: None})
    db = connection[db_name]
    db.drop_collection(collection_name)
    col = db[collection_name]
    col.insert_many(df.to_dict('records'))
    print(f'{collection_name} collection inserted into {db_name}')
    connection.close()