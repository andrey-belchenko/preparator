import io
import pandas as pd
import requests
from urllib.parse import quote


def clear_column_names(df: pd.DataFrame) -> pd.DataFrame:
    col_map = {}
    for col in df.columns:
        col_map[col] = col.replace(".", "_")
    df = df.rename(columns=col_map)
    return df


