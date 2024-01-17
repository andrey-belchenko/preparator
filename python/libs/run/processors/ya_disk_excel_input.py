from run.utils import yandex_disk
import pandas as pd
from df_prep import Task, ParamType, Module


def create(module: Module):
    processor = module.create_processor(
        name="ya_disk_excel_input",
        title="Входящий коннектор. Яндекс Диск. Excel файл",
        description="Читает Excel файл из Яндекс Диска и записывает данные 1-го листа в коллекцию (предварительно коллекция зачищается). 1-я строка файла содержит заголовки полей.",
    )
    processor.add_param(
        name="file_path",
        title="Путь к файлу",
        description="Относительный путь от корневой папки Яндекс Диска",
    )
    processor.add_param(
        name="api_token",
        type=ParamType.SECRET,
        title="Токен для доступа к API Яндекс Диск",
        description="Получить токен можно на странице https://yandex.ru/dev/disk/poligon/",
    )
    processor.add_output(name="output1", title="Целевая коллекция")

    def action(task: Task):
        file_path = task.get_param("file_path")
        api_token = task.get_param("api_token")
        file_data = yandex_disk.download_file(api_token, file_path)
        excel_file = pd.read_excel(file_data)
        items = excel_file.to_dict("records")
        output_writer = task.get_output_writer("output1")
        output_writer.write_many(items)
        print(f"file {file_path} data loaded into '{output_writer.name}' collection")

    processor.set_action(action)
