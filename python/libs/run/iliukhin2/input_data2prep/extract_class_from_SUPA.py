import pandas as pd
import yaml
import argparse
from pymongo import MongoClient


parser = argparse.ArgumentParser(description='Извлечение класса из общего файла')

parser.add_argument('-db', '--database', type=str, 
                    help='Имя базы данных, где лежит коллекция', 
                    required=True)

parser.add_argument('-col', '--collection', type=str, 
                    help='Имя колекции', 
                    required=True)

parser.add_argument('-cl', '--classname', type=str, 
                    help='Имя класса, который нужно извлечь', 
                    required=True)

args = parser.parse_args()

with open('params.yml', 'r') as f:
    params = yaml.full_load(f)


connection = MongoClient(params['mongo_connection'])
db = connection[args.database]
col = db[args.collection]
df = pd.DataFrame(list(col.find()))

last_numbers_of_class = {
        'GroundDisconnector': ['Заземляющие ножи', 'Заземляющий нож', 'ЗОН', 'Короткозамыкатель'],
        'Disconnector': ['Отделитель', 'Разъединитель'],
        'LinearShuntCompensator': ['БСК'],
        'StaticVarCompensator': ['Шунтирующий реактор'],
        }

def extract_required_class(text):
    text = text.split('_')
    if text[-1] in last_numbers_of_class[args.classname]:
            return True
    return None

df['is_required_class'] = df['НазваниеКласса'].apply(extract_required_class)
df_required_class = df[df['is_required_class'] == True]


connection = MongoClient(params['mongo_connection'])
db_name = args.classname
collection_name = f'{args.classname}_supa'
db = connection[db_name]
db.drop_collection(collection_name)
col = db[collection_name]
col.insert_many(df_required_class.to_dict('records'))
print(f'{collection_name} collection inserted into {db_name}')
connection.close()
