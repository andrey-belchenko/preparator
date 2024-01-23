from run.utils import excel, yandex_disk
import pandas as pd
from df_prep import Module
from .utils import ya_disk_input


def create(module: Module):
    processor = module.create_processor(
        title="Входящий коннектор. Яндекс Диск. CSV файл",
        description="Читает CSV файл из Яндекс Диска и записывает данные в коллекцию (предварительно коллекция зачищается)",
    )

    def read_data(data):
        return pd.read_csv(data, sep=";")

    ya_disk_input.configure(processor, read_data)