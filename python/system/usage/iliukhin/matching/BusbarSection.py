import pandas as pd
import re
import yaml
from data_io import load_data_from_db, insert_collection_into_db
from merge import merge_by_key_column
import warnings
warnings.filterwarnings("ignore")


with open('params.yml', 'r') as f:
    params = yaml.full_load(f)

class_name = 'BusbarSection'

df_rs, df_supa, df_substations_matched = load_data_from_db(class_name, params)

# Некоторые Uid оказались в верхнем регистре
df_rs['Uid'] = df_rs['Uid'].apply(lambda x: x.lower())

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

# Номер секции шин + техместо
def get_section(text):
    text = text.replace('ОСШ', '0').replace('110', '').replace('III', '3').replace('II', '2').replace('I', '1')
    match = re.findall('\d', text)
    if match:
        return match[0]
    return ''

# Номер секции шин (implementation)
df_rs['section'] = df_rs['name'].apply(get_section)
df_supa['section'] = df_supa['Название'].apply(get_section)

df_rs['section_techplace'] = df_rs['section'] +'_'+ df_rs['Техместо_ПС']
df_supa['section_techplace'] = df_supa['section'] +'_'+ df_supa['ВерхнееТМ']

# final result
_, df_merge1, df_rs, df_supa, df_duples = merge_by_key_column(df_rs=df_rs,
                                                   df_supa=df_supa,
                                                   common_key_column='section_techplace')

insert_collection_into_db(class_name=class_name,
                          params=params,
                          collection_name=f'{class_name}_matched',
                          df=df_merge1)

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



print('Сопоставлено', (df_merge1.shape[0])/(df_supa.shape[0] + df_merge1.shape[0]), 'СУПА')
print('Сопоставлено', (df_merge1.shape[0])/(df_rs.shape[0] + df_merge1.shape[0]), 'RS')