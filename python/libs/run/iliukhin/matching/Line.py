import pandas as pd
import re
import yaml
from tokenize import tokenize, NAME
from io import BytesIO
from data_io import load_data_from_db, insert_collection_into_db
from merge import merge_by_key_column


with open('params.yml', 'r') as f:
    params = yaml.full_load(f)

class_name = 'Line'

# load data
df_rs, df_supa = load_data_from_db(class_name, params)

df_rs['first_sylls'] = df_rs['name'].apply(lambda x: x.split(' ')[0])
df_rs = df_rs[df_rs['first_sylls'].isin(['КВЛ', 'ВЛ'])].drop('first_sylls', axis=1)
df_rs = df_rs[~df_rs['name'].str.contains('35 кВ')]
df_rs['name'] = df_rs['name'].fillna('nan')
df_rs['name'] = df_rs['name'].apply(lambda x: x.replace('II', '2').replace('I', '1'))

filter = df_supa['Название'].str.contains('ВЛ-35кВ') | df_supa['Название'].str.contains('ВЛ-35 кВ') | df_supa['Дисп_наименование'].str.contains('ВЛ-35кВ') | df_supa['Дисп_наименование'].str.contains('ВЛ-35 кВ')
df_supa = df_supa[~filter]
df_supa['Название'] = df_supa['Название'].fillna('nan')
df_supa['Дисп_наименование'] = df_supa['Дисп_наименование'].fillna('nan')
df_supa['Название'] = df_supa['Название'].apply(lambda x: x.replace('II', '2').replace('I', '1'))
df_supa['Дисп_наименование'] = df_supa['Дисп_наименование'].apply(lambda x: x.replace('II', '2').replace('I', '1'))

# Коды внутри названий
def find_code(text):
    if isinstance(text, str):
        match = re.findall('\(.*\)', text)
        if match:
            return match[0]\
                .replace('(', '')\
                .replace(')', '')\
                .replace(' ', '')\
                .replace('-', '')\
                .strip()
    return ''

df_supa['codes'] = df_supa['Дисп_наименование'].apply(find_code)
df_rs['codes'] = df_rs['name'].apply(find_code)

# Названия откуда - куда
num2str = {
    '11': 'одиннадцать',
    '20': 'двадцать',
    '31': 'тридцать_один',
    '54': 'пятьдесят_четыре',
    '1': 'один',
    '2': 'два',
    '3': 'три',
    '4': 'четыре',
    '6': 'шесть',
}

def get_num(name, text):
    num = 0
    match = re.findall(f'{name} ?-? ?\d+', text)
    if match:
        num = re.findall('\d+', match[0])[0]
    text = re.sub(f'{name} ?№? ?-?\d', f'{name}-{num2str.get(num)}', text)
    return text

def find_destination(text):
    if isinstance(text, str):
        match = re.findall('\(.*\)', text)
        if match:
            text = text[:text.index(match[0])]
            
        text = get_num('Азот', text)
        text = get_num('Сотая', text)
        text = get_num('тяговая', text)
        text = get_num('Тяговая', text)
        text = get_num('Томусинская', text)
        text = get_num('Товарищ', text)
        text = get_num('Ширпотреб-Северная', text)
        text = get_num('Ширпотреб-Прокатная', text)
        text = get_num('Опорная', text)
        text = get_num('Тырганская', text)
        text = get_num('Абразивная', text)
        text = get_num('Распадская 5', text)
        text = get_num('Хвостохранилище', text)
        text = get_num('Карьерная', text)
        text = get_num('Разъезд', text)
        text = get_num('ЯЦЗ', text)
        text = get_num('Химпром', text)
        text = get_num('Проскоковская', text)
        text = get_num('Западно-Сибирская ТЭЦ', text)
        text = get_num('Западно-Сибирская ТЭЦ - Опорная', text)
        text = get_num('Ускатская-Луговая', text)
        text = get_num('Темирская', text)
        text = get_num('Шушталепская', text)
        text = get_num('Красноярская', text)
                       
        text = re.sub('ё', 'е', text)
        text = re.sub('с отп.на', '', text)
        text = re.sub('Цинзаводская', 'Цинкзаводская', text)
        text = re.sub('Заискиимская', 'Заискитимская', text)
        text = re.sub('Имена', 'Имени', text)
        text = re.sub('цепь', '', text)
        text = re.sub('Беловская ГРЭС – Гурьевская ГРЭС', 'Беловская ГРЭС – Гурьевская', text)
        text = re.sub('ЦентральнаяТЭЦ', 'Центральная ТЭЦ', text)
        text = re.sub('СибирскаяТЭЦ', 'Сибирская ТЭЦ', text)
        text = re.sub('[сc]{1}к\.', 'ский', text)
        text = re.sub('Беллык', 'Беллыкский', text)
        text = re.sub('[сc]{1}кая', 'ский', text)
        text = re.sub('Беллыкскийский', 'Беллыкский', text)
        text = re.sub('К?ВЛ[ -]110 ?кВ', '', text)
        text = re.sub('М.Имыш', 'Малый Имыш', text)
        text = re.sub('К.Шалтырь', 'Кия-Шалтырь', text)
        text = re.sub('Н.Огур', 'Новый Огур', text)
        text = re.sub('Н.Сыда', 'Новая Сыда', text)
        text = re.sub('Мусохраноская', 'Мусохрановская', text)
        text = re.sub('\d+ ?цепь', '', text)
        text = re.sub('[сc]? *отпай\w+ *(на)?', '', text)
        text = re.sub('[Н]?ПС', '', text)
        text = re.sub('ПП', '', text)
        text = text.lower()
        text = re.sub('обьект', 'объект', text)
        text = re.sub('"', '', text)
        tokens = []
        g = tokenize(BytesIO(text.encode('utf-8')).readline)
        for toktype, tokval, _, _, _ in g:
            if toktype == NAME:
                tokens.append(tokval.strip())
        return '_'.join(tokens).strip()
    return ''

df_supa['destinations'] = df_supa['Дисп_наименование'].apply(find_destination)
df_rs['destinations'] = df_rs['name'].apply(find_destination)

# rules implementation
# codes + destinations
df_supa['dests_plus_codes'] = df_supa['destinations']+'_'+df_supa['codes']
df_rs['dests_plus_codes'] = df_rs['destinations']+'_'+df_rs['codes']

# ручное
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ ТЭЦ АКХЗ-Городская (ВЛ АГ-88) 2 цепь с отпайкой на ПС Кокс (АК-1436)'), 'dests_plus_codes'] = 'тэц_акхз_городский_кокс_ВЛАГ88,ВЛАК1436'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ ТЭЦ АКХЗ – Городская (ВЛ АГ-87) 1 цепь с отпайкой на ПС Кокс (ВЛ АК-1435)'), 'dests_plus_codes'] = 'тэц_акхз_городский_кокс_ВЛАГ87,ВЛАК1435'
# ---

_, df_merge1, df_rs, df_supa, _ = merge_by_key_column(df_rs=df_rs,
                                                   df_supa=df_supa,
                                                   common_key_column='dests_plus_codes')

# Коды внутри названий (implementation)
_, df_merge2, df_rs, df_supa, _ = merge_by_key_column(df_rs=df_rs,
                                                   df_supa=df_supa,
                                                   common_key_column='codes')

# цепь
def find_chain(text):
    if isinstance(text, str):
        text = text.replace('Опорная 11-1', 'Опорная-11 1 цепь')
        text = text.replace('Опорная 11-2', 'Опорная-11 2 цепь')
        text = text.replace('Опорная 20-1', 'Опорная 20 1 цепь')
        text = text.replace('Опорная 20-2', 'Опорная 20 2 цепь')
        text = re.sub('НПС-1', '1 цепь', text)
        text = re.sub('НПС-2', '2 цепь', text)
        text = re.sub('Спутник-1', 'Спутник 1 цепь', text)
        text = re.sub('Спутник-2', 'Спутник 2 цепь', text)
        match = re.findall('\d цепь', text)
        if match:
            res = match[0].split(' ')
            return res[0]
    return '0'

df_supa['chain'] = df_supa['Дисп_наименование'].apply(find_chain)
df_rs['chain'] = df_rs['name'].apply(find_chain)

df_supa['dests_plus_chains'] = df_supa['destinations']+'_'+df_supa['chain']
df_rs['dests_plus_chains'] = df_rs['destinations']+'_'+df_rs['chain']

# ручное
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Краснополянская – Красноярская № 2 с отпайками'), 'dests_plus_chains'] = 'краснополянский_красноярский_2'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Краснополянская – Красноярская № 1 с отпайками'), 'dests_plus_chains'] = 'краснополянский_красноярский_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Краснополянская – Красноярская 1 цепь сапйками'), 'dests_plus_chains'] = 'краснополянский_красноярский_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Краснополянская – Красноярская 2 цепь с отпайками'), 'dests_plus_chains'] = 'краснополянский_красноярский_2'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Прокопьевская-Кис-Заводская-1'), 'dests_plus_chains'] = 'прокопьевский_киселевский_заводский_вахрушевский_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Прокопьевская-Кис-Заводская-2'), 'dests_plus_chains'] = 'прокопьевский_киселевский_заводский_вахрушевский_2'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Томь-Усинская ГРЭС-Распадская 5-1'), 'dests_plus_chains'] = 'томь_усинский_грэс_распадский_пять_1'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Томь-Усинская ГРЭС-Распадская 5-2'), 'dests_plus_chains'] = 'томь_усинский_грэс_распадский_пять_2'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Томь-Усинская ГРЭС – ЦОФ-1'), 'dests_plus_chains'] = 'томь_усинский_грэс_цоф_1'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Томь-Усинская ГРЭС – ЦОФ-2'), 'dests_plus_chains'] = 'томь_усинский_грэс_цоф_2'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Томь-Усинская ГРЭС-Распадская 5-1'), 'dests_plus_chains'] = 'томь_усинский_грэс_распадский_пять_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Томь-Усинская ГРЭС-Распадская 5-2'), 'dests_plus_chains'] = 'томь_усинский_грэс_распадский_пять_2'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Томьусинская ГРЭС-ЦОФ Сибирь-1'), 'dests_plus_chains'] = 'томь_усинский_грэс_цоф_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Томьусинская ГРЭС-ЦОФ Сибирь-2'), 'dests_plus_chains'] = 'томь_усинский_грэс_цоф_2'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Ускатская - Луговая-1'), 'dests_plus_chains'] = 'ускатский_луговая_1'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Ускатская - Луговая-2'), 'dests_plus_chains'] = 'ускатский_луговая_2'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Ускатская-Луговая-1'), 'dests_plus_chains'] = 'ускатский_луговая_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Ускатская-Луговая-2'), 'dests_plus_chains'] = 'ускатский_луговая_2'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Ускатская-Ильинская-1 2 цепь'), 'dests_plus_chains'] = 'ускатский_ильинский_степная_2'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Западно-Сибирская ТЭЦ - Опорная - 20 1 цепь'), 'dests_plus_chains'] = 'западно_сибирский_тэц_опорная_двадцать0_1'
df_rs.loc[(df_rs['name'] == 'ВЛ 110 кВ Западно-Сибирская ТЭЦ - Опорная - 20 2 цепь'), 'dests_plus_chains'] = 'западно_сибирский_тэц_опорная_двадцать0_2'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Ширпотреб-Прокатная-1'), 'dests_plus_chains'] = 'ширпотреб_прокатная_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Ширпотреб-Прокатная-2'), 'dests_plus_chains'] = 'ширпотреб_прокатная_2'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Южно-Кузбаская ГРЭС-Кедровая-1'), 'dests_plus_chains'] = 'южно_кузбасский_грэс_кедровая_малиновский_1'
df_supa.loc[(df_supa['Дисп_наименование'] == 'ВЛ 110 кВ Южно-Кузбасская ГРЭС-Кедровая-2'), 'dests_plus_chains'] = 'южно_кузбасский_грэс_кедровая_малиновский_2'
# ---

# цепь(implementation)
_, df_merge3, df_rs, df_supa, df_duples = merge_by_key_column(df_rs=df_rs,
                                                   df_supa=df_supa,
                                                   common_key_column='dests_plus_chains')

#final result
needed_cols = ['Uid', 'Техместо', 'name', 'Дисп_наименование', 'Класс_rs']
columns2rename = {'Класс_rs': 'Класс', 
                 'name': 'Наименование',
                 'Дисп_наименование': 'Диспетчерское наименование'}

df_union = pd.concat([df_merge1[needed_cols], df_merge2[needed_cols], df_merge3[needed_cols]]).rename(columns=columns2rename)

insert_collection_into_db(class_name=class_name,
                          params=params,
                          collection_name=f'{class_name}_matched',
                          df=df_union)

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

print('Сопоставлено', (df_union.shape[0])/(df_supa.shape[0] + df_union.shape[0]), 'СУПА')
print('Сопоставлено', (df_union.shape[0])/(df_rs.shape[0] + df_union.shape[0]), 'RS')