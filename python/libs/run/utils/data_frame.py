import io
import pandas as pd
import requests
from urllib.parse import quote


def select_columns(df: pd.DataFrame, columns):
    df = df[columns.keys()]
    df = df.rename(columns=columns)
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
