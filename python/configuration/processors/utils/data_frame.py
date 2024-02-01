import pandas as pd

def select_columns(df: pd.DataFrame, columns: dict):
    revCols = {}
    for it in columns:
        revCols[columns[it]] = it
    df = df[revCols.keys()]
    df = df.rename(columns=revCols)
    return df


def add_columns_with_const_values(df: pd.DataFrame, columns: dict):
    df = df.assign(**columns)
    return df


def clear_column_names(df: pd.DataFrame) -> pd.DataFrame:
    col_map = {}
    changes = False
    for col in df.columns:
        if "." in col:
            changes = True
        col_map[col] = col.replace(".", "_")
    if changes:
        df = df.rename(columns=col_map)
    return df
