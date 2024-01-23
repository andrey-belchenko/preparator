from run.utils import excel, yandex_disk
import pandas as pd
from df_prep import Task, ParamType, Module
from .utils import ya_disk_input


def create(module: Module):
    processor = module.create_processor(
        name="ya_disk_excel_input",
        title="Входящий коннектор. Яндекс Диск. CSV файл",
        description="Читает CSV файл из Яндекс Диска и записывает данные в коллекцию (предварительно коллекция зачищается)",
    )

    processor.add_input(
        "params", title="Параметры", schema=ya_disk_input.input_params_schema
    )
    processor.add_output("output", title="Целевая коллекция")

    def action(task: Task):
        ya_disk_input.action(task, pd.read_csv)

    processor.set_action(action)
