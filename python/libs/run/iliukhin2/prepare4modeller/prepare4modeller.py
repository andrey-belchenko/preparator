from pymongo import MongoClient
import os

db_names = [
    'Substation',
    'PowerTransformer',
    'Line',
    'VoltageLevel',
    'BusbarSection'
]

if not os.path.isdir('keys4modeller'):
    os.mkdir('keys4modeller')

n = 0
nf = 0
for db_name in db_names:
    db = con[db_name]
    df = pd.DataFrame(list(db[f'{db_name}_matched'].find()))
    
    new_rows = []
    
    # Заполняем новый DataFrame, используя данные из исходного
    for index, row in df.iterrows():
        new_rows.append({
            'iri': db_name +'_'+ row['Uid'],
            'externalSystemId': 'СК-11',
            'externalKey': row['Uid'],
            'externalKeyClass': row['Класс'],
        })
        new_rows.append({
            'iri': db_name +'_'+ row['Uid'],
            'externalSystemId': 'СУПА',
            'externalKey': row['Техместо'],
            'externalKeyClass': row['Класс'],
        })
    
    # Преобразуем список словарей в DataFrame
    new_rows_df = pd.DataFrame(new_rows)
    new_rows_df.to_csv(f'{db_name}_keys.csv', sep=';', index=False)
    display(new_rows_df.head())
    n += df.shape[0]
    nf += 1
print('Выполнено', n, ' записей в', nf, 'файлов')
