import pandas as pd
import re
import yaml
from data_io import load_data_from_db, insert_collection_into_db
from merge import merge_by_key_column


with open('params.yml', 'r') as f:
    params = yaml.full_load(f)

class_name = 'PowerTransformer'

# load data
df_rs, df_supa, df_substations_matched = load_data_from_db(class_name, params)

# df_supa transform
df_supa['БЕ'] = df_supa['БЕ'].astype('int')

# Берем Техместо из ПС (ранее сопоставленных). Кладем в RS20
techplace_substations_matched = set(df_substations_matched['Техместо'].tolist())
techplace_substations_supa = set(df_supa['ВерхнееТМ'].tolist())

iri_substations_matched = set(df_substations_matched['Uid'].tolist())
iri_substations_rs = set(df_rs['Substation_Uid'].tolist())

iri2techplace = dict(zip(df_substations_matched['Uid'], df_substations_matched['Техместо']))
df_rs['Техместо_ПС'] = df_rs['Substation_Uid'].apply(lambda x: iri2techplace.get(x))

# Название трансформатора + Техместо ПС
def get_name(text):
    match = re.findall('[ТT]С?[-]?\d', text)
    if match:
        res = match[0].replace('-', '').replace('-', '').replace('T', 'Т').replace('С', '')
        return res
    match = re.findall('\d[ А]?Т', text)
    if match:
        res = match[0][-1]+match[0][0]
        return res
    match = re.findall('№\d', text)
    if match:
        num = re.findall('\d', match[0])
        return 'Т'+num[0]
    return ''

# Сопоставление
df_rs['transformer'] = df_rs['name'].apply(get_name)
df_supa['transformer'] = df_supa['НазваниеТехнМеста'].apply(get_name)

df_supa['transformer_techplace'] = df_supa['transformer'] +'_'+ df_supa['ВерхнееТМ']
df_rs['transformer_techplace'] = df_rs['transformer'] +'_'+ df_rs['Техместо_ПС']

# ручное
df_supa.loc[(df_supa['Техместо'] == 'PS110-001029-02'), 'transformer_techplace'] = 'Т2_PS110-001029'
df_supa.loc[(df_supa['Техместо'] == 'PS110-000006-03'), 'transformer_techplace'] = 'Т3_PS110-000006'
# ---

_, df_merge1, df_rs, df_supa, df_duples = merge_by_key_column(df_rs=df_rs,
                                                   df_supa=df_supa,
                                                   common_key_column='transformer_techplace')

#final result
needed_cols = ['Uid', 'Техместо', 'name', 'НазваниеТехнМеста', 'Класс']
columns2rename = {'name': 'Наименование',
                 'НазваниеТехнМеста': 'Название Технического Места'}

df_res1 = df_merge1[needed_cols].rename(columns=columns2rename)

insert_collection_into_db(class_name=class_name,
                          params=params,
                          collection_name=f'{class_name}_matched',
                          df=df_res1)

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

print('Сопоставлено', (df_res1.shape[0])/(df_supa.shape[0] + df_res1.shape[0]), 'СУПА')
print('Сопоставлено', (df_res1.shape[0])/(df_rs.shape[0] + df_res1.shape[0]), 'RS')