import io
import pandas as pd
import requests
from urllib.parse import quote

from run.utils import data_frame


def read_excel(data: io.BytesIO) -> pd.DataFrame:
    df = pd.read_excel(data)
    df = df.replace({pd.NaT: None})
    df = data_frame.clear_column_names(df)
    return df
