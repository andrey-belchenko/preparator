import pandas as pd
from collections import Counter

def get_cols_with_len_gt_one(row, key, columns):
    cols = []
    for col in columns:
        if col != key:
            if len(row[col]) > 1:
                cols.append(col)
    return ', '.join(map(str, cols))

def list2string(column_val):
    if isinstance(column_val, list):
        return ', '.join(map(str, column_val))
    return column_val

def merge_by_key_column(df_rs, df_supa, common_key_column):
    '''
Parameters
----------
df_rs: pd.DataFrame
df_supa: pd.DataFrame
common_key_column: string

Returns
-------
feasible_to_match, df_merge, df_rs, df_supa, df_duples

feasible_to_match: int - Количество уникальных ключей (связь 1 к 1)
df_merge: pd.DataFrame - Результат объединения по ключу (связь 1 к 1)
df_rs: pd.DataFrame - РС20 за исключением объелиненных данных
df_supa: pd.DataFrame - СУПА за исключением объелиненных данных
df_duples: pd.DataFrame - Дубликаты

    '''
    rs_key_list = df_rs[common_key_column].tolist()
    supa_key_list = df_supa[common_key_column].tolist()

    rs_key = set(rs_key_list)
    supa_key = set(supa_key_list)
    print(len(supa_key & rs_key))

    rs_key_cnt = dict(Counter(rs_key_list))
    supa_key_cnt = dict(Counter(supa_key_list))

    rs_key_single = set([key for key in rs_key_cnt.keys() if rs_key_cnt[key] == 1])
    supa_key_single = set([key for key in supa_key_cnt.keys() if supa_key_cnt[key] == 1])

    df_merge = df_rs[df_rs[common_key_column].isin(rs_key_single)].merge(df_supa[df_supa[common_key_column].isin(supa_key_single)], on=common_key_column, suffixes=['_rs', '_supa'])
    df_rs = df_rs[~df_rs['Uid'].isin(df_merge['Uid'].unique())]
    df_supa = df_supa[~df_supa['Техместо'].isin(df_merge['Техместо'].unique())]

    feasible_to_match = len(supa_key_single & rs_key_single)

    if len(supa_key & rs_key) == feasible_to_match:
        return feasible_to_match, df_merge, df_rs, df_supa, 'no duplicates'

    df_rs_duples = df_rs.groupby(common_key_column).agg(list).reset_index()
    df_supa_duples = df_supa.groupby(common_key_column).agg(list).reset_index()
    df_duples = pd.merge(df_rs_duples, df_supa_duples, on=common_key_column, suffixes=['_rs', '_supa'])
    df_duples['cols_with_len_gt_one'] = df_duples.apply(get_cols_with_len_gt_one, axis=1, args=(common_key_column, list(df_duples.columns)))
    for col in df_duples.columns:
        df_duples[col] = df_duples[col].apply(list2string)

    return feasible_to_match, df_merge, df_rs, df_supa, df_duples
