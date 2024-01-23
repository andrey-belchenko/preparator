from run.utils import excel, yandex_disk
import pandas as pd
from df_prep import Task, Module
from .utils import ya_disk_input


def create(module: Module):
    processor = module.create_processor(
        title="Входящий коннектор. Яндекс Диск. Excel файл",
        description="Читает Excel файл из Яндекс Диска и записывает данные 1-го листа в коллекцию (предварительно коллекция зачищается). 1-я строка файла содержит заголовки полей.",
    )

    ya_disk_input.configure(processor, excel.read_excel)
   