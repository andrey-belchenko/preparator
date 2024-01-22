from run.utils import yandex_disk
import pandas as pd
from df_prep import Task, ParamType, Module


def create(module: Module):
    processor = module.create_processor(
        name="ya_disk_excel_input",
        title="Входящий коннектор. Яндекс Диск. Excel файл",
        description="Читает Excel файл из Яндекс Диска и записывает данные 1-го листа в коллекцию (предварительно коллекция зачищается). 1-я строка файла содержит заголовки полей.",
    )

    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "title": "Путь к файлу",
                "description": "Относительный путь от корневой папки Яндекс Диска",
            },
            "api_token": {
                "type": "string",
                "title": "Токен для доступа к API Яндекс Диск",
                "description": "Получить токен можно на странице https://yandex.ru/dev/disk/poligon/",
                "secret": True,
            },
        },
    }

    processor.add_input("params", title="Параметры", schema=schema)
    processor.add_output("output", title="Целевая коллекция")

    def action(task: Task):
        params = task.get_input_reader("params").read_one()
        file_path = params["file_path"]
        api_token = params["api_token"]
        file_data = yandex_disk.download_file(api_token, file_path)
        excel_file = pd.read_excel(file_data)
        items = excel_file.to_dict("records")
        output_writer = task.get_output_writer("output")
        output_writer.write_many(items)
        print(f"file {file_path} data loaded into '{output_writer.name}' collection")

    processor.set_action(action)
