import io
import pandas as pd


def read_excel(data: io.BytesIO) -> pd.DataFrame:
    df = pd.read_excel(data)
    df = df.replace({pd.NaT: None})
    return df
