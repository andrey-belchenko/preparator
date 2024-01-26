import pandas as pd
from df_prep import Module, Processor
from .utils import input_ya_disk


def create():
    processor = Processor(
        title="Входящий коннектор. Яндекс Диск. CSV файл",
        description="Читает CSV файл из Яндекс Диска и записывает данные в коллекцию (предварительно коллекция зачищается)",
    )

    def read_data(data):
        return pd.read_csv(data, sep=";")

    input_ya_disk.configure(processor, read_data)
    return processor
