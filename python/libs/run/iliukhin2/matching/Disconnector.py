import pandas as pd
import re
import yaml
from data_io import load_data_from_db, insert_collection_into_db
from merge import merge_by_key_column
import warnings
warnings.filterwarnings("ignore")


with open('params.yml', 'r') as f:
    params = yaml.full_load(f)

class_name = 'Disconnector'

df_rs, df_supa, df_substations_matched = load_data_from_db(class_name, params)

df_supa['voltage_level'] = df_supa['Техместо'].apply(lambda x: x.split('-')[2])
df_supa = df_supa[df_supa['voltage_level'] == '12']

# Берем Техместо из ПС (ранее сопоставленных). Кладем в RS20
techplace_substations_matched = set(df_substations_matched['Техместо'].tolist())
techplace_substations_supa = set(df_supa['ВерхнееТМ'].tolist())

uid_substations_matched = set(df_substations_matched['Uid'].tolist())
uid_substations_rs = set(df_rs['Substation_Uid'].tolist())

uid2techplace = dict(zip(df_substations_matched['Uid'], df_substations_matched['Техместо']))
test = []
for key in uid2techplace.keys():
    test.append(uid2techplace[key] == df_substations_matched[df_substations_matched['Uid'] == key]['Техместо'].values[0])

assert all(test) == True
df_rs['Техместо_ПС'] = df_rs['Substation_Uid'].apply(lambda x: uid2techplace.get(x))

# Нормальизация имени
def name_norm(text):
    if isinstance(text, str):
        text = text.lower()
        chars2remove = [' ', '-', '_', 'разъединитель', 
                        '110кв', '110', '/', '\\', '.', ',', 
                        'секш', 'ввод', 'ввода', 'сек', 
                        'вл', '"', 
                        'сш.', 'сш', 'шр', 'т-'
                       ]
        for char in chars2remove:
            text = text.replace(char, '')
        text = text.replace('II', '2').replace('I', '1').replace('c', 'с').replace('зт', '3т').replace('мср', 'ср')
    return text

# 1. Сопоставление по имени и Техместу (df_supa['Название'])
df_supa['name'] = df_supa['Название']
df_rs['name_techplace'] = df_rs['name'] +'_'+ df_rs['Техместо_ПС']
df_supa['name_techplace'] = df_supa['name'] +'_'+ df_supa['ВерхнееТМ']

_, df_merge1, df_rs, df_supa, _ = merge_by_key_column(df_rs, df_supa, 'name_techplace')

# 2. Сопоставление по нормализованному имени и Техместу (df_supa['Название'])
df_supa['name_norm'] = df_supa['Название'].apply(name_norm)
df_rs['name_norm'] = df_rs['name'].apply(name_norm)

df_rs['name_norm_techplace'] = df_rs['name_norm'] +'_'+ df_rs['Техместо_ПС']
df_supa['name_norm_techplace'] = df_supa['name_norm'] +'_'+ df_supa['ВерхнееТМ']

_, df_merge2, df_rs, df_supa, _ = merge_by_key_column(df_rs, df_supa, 'name_norm_techplace')

# 3. Сопоставление по имени и Техместу (df_supa['ДиспНаименование'])
df_supa['name'] = df_supa['ДиспНаименование']
df_supa['name_techplace'] = df_supa['name'] +'_'+ df_supa['ВерхнееТМ']

_, df_merge3, df_rs, df_supa, _ = merge_by_key_column(df_rs, df_supa, 'name')

# 4. Сопоставление по нормализованному имени и Техместу (df_supa['ДиспНаименование'])
df_supa['name_norm'] = df_supa['ДиспНаименование'].apply(name_norm)
df_supa['name_norm_techplace'] = df_supa['name_norm'] +'_'+ df_supa['ВерхнееТМ']

_, df_merge4, df_rs, df_supa, df_duples = merge_by_key_column(df_rs, df_supa, 'name_norm_techplace')

# final result
df_matched = pd.concat([df_merge1, df_merge2, df_merge3, df_merge4])

insert_collection_into_db(class_name=class_name,
                          params=params,
                          collection_name=f'{class_name}_matched',
                          df=df_matched)

insert_collection_into_db(class_name=class_name,
                          params=params,
                          collection_name='SUPA_unmatched',
                          df=df_supa)

insert_collection_into_db(class_name=class_name,
                          params=params,
                          collection_name='RS_unmatched',
                          df=df_rs)

insert_collection_into_db(class_name=class_name,
                          params=params,
                          collection_name=f'{class_name}_duplicates',
                          df=df_duples)

print('Сопоставлено', (df_matched.shape[0])/(df_supa.shape[0] + df_matched.shape[0]), 'СУПА')
print('Сопоставлено', (df_matched.shape[0])/(df_rs.shape[0] + df_matched.shape[0]), 'RS')
