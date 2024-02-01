import io
import pandas as pd
from run.processors.utils import data_frame


def read_excel(data: io.BytesIO) -> pd.DataFrame:
    df = pd.read_excel(data)
    df = df.replace({pd.NaT: None})
    return df
