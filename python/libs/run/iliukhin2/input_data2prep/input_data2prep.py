import pandas as pd
from pymongo import MongoClient
import yaml
import os
import re
from transform import transform_rs, transform_supa

with open('params.yml', 'r') as f:
    params = yaml.full_load(f)

connection = MongoClient(params['mongo_connection'])

assert os.path.isdir(params['input_directory']), f"Заданная папка {params['input_directory']} не существует. См. файл params.yml"

def insert_collection(db_name, col_name, df):
    db = connection[db_name]
    db.drop_collection(col_name)
    col = db[col_name]
    col.insert_many(df.to_dict('records'))
    print(f'{col_name} collection inserted into {db_name} database')

files = []
for file in os.listdir(params['input_directory']):
    if ('.csv' in file or '.xlsx' in file) and '_' in file:
        equip_class_system, file_ext = file.split('.')
        equip_class, system = equip_class_system.split('_')
        assert system in ['rs', 'supa'], f'В названии файла {file} неверно указана система источник'
        files.append({
            'file': file,
            'class': equip_class,
            'system': system,
            'file_ext': file_ext,
            'path': os.path.join(params['input_directory'], file)
        })

for file in files:
    db_name = file['class']
    col_name = f"{file['class']}_{file['system']}"

    if file['system'] == 'rs':
        columns2rename = params['RS_columns'][file['class']]
        df = transform_rs(path=file['path'], 
                                equip_class=file['class'], 
                                columns2rename=columns2rename)
        
        insert_collection(db_name, col_name, df)

    if file['system'] == 'supa':
        df = transform_supa(path=file['path'])
        insert_collection(db_name, col_name, df)