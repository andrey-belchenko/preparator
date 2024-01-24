import pandas as pd
import re
import yaml
from data_io import load_data_from_db, insert_collection_into_db
from merge import merge_by_key_column
import warnings
warnings.filterwarnings("ignore")


with open('params.yml', 'r') as f:
    params = yaml.full_load(f)

class_name = 'LinearShuntCompensator'

df_rs, df_supa, df_substations_matched = load_data_from_db(class_name, params)
df_supa = df_supa[df_supa['Техместо'] != 'PS110-000492-12-02-601']

# Берем Техместо из ПС (ранее сопоставленных). Кладем в RS20
techplace_substations_matched = set(df_substations_matched['Техместо'].tolist())
techplace_substations_supa = set(df_supa['Верхнее ТМ'].tolist())

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
    text = text.lower()
    text = text.replace('присоединение', '')
    match = re.findall('бск', text)
    if match:
        return match[0]

df_rs['name_norm'] = df_rs['name'].apply(name_norm)
df_supa['name_norm'] = df_supa['Название'].apply(name_norm)

df_rs['name_norm_techplace'] = df_rs['name_norm'] +'_'+ df_rs['Техместо_ПС']
df_supa['name_norm_techplace'] = df_supa['name_norm'] +'_'+ df_supa['Верхнее ТМ']


# final result
df_matched = pd.merge(df_rs, df_supa, on='name_norm_techplace')

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

print('Сопоставлено', (df_matched.shape[0])/(df_supa.shape[0]), 'СУПА')
print('Сопоставлено', (df_matched.shape[0])/(df_rs.shape[0]), 'RS')