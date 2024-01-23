from run.utils import excel, yandex_disk
import pandas as pd
from df_prep import Task, ParamType, Module
from .utils import ya_disk_input


def create(module: Module):
    processor = module.create_processor(
        name="ya_disk_csv_input",
        title="Входящий коннектор. Яндекс Диск. CSV файл",
        description="Читает CSV файл из Яндекс Диска и записывает данные в коллекцию (предварительно коллекция зачищается)",
    )


    processor.add_input(
        "params", title="Параметры", schema=ya_disk_input.input_params_schema
    )
    processor.add_output("output", title="Целевая коллекция")

    def read_data(data):
        return pd.read_csv(data, sep=";")

    def action(task: Task):
        ya_disk_input.action(task, read_data)

    processor.set_action(action)
