import pandas as pd
from df_prep import Module, Processor, Task, Task
from run.processors.utils import data_frame, yandex_disk


def configure(processor: Processor, get_data_frame_func):
    schema = {
        "type": "object",
        "properties": {
            "folder_path": {
                "type": "string",
                "title": "Путь к папке",
                "description": "Путь к папке от корневой папки Яндекс Диска",
                "required": True,
            },
            "file_path": {
                "type": "string",
                "title": "Путь к папке",
                "description": "Относительный путь к файлу от папки",
                "required": True,
            },
            "api_token": {
                "type": "string",
                "title": "Токен для доступа к API Яндекс Диск",
                "description": "Получить токен можно на странице https://yandex.ru/dev/disk/poligon/",
                "secret": True,
                "required": True,
            },
            "select_fields": {
                "title": "Выбрать и переименовать поля для загрузки",
                "description": r'Формат JSON {"Целевое поле":"Поле в файле",...}',
                "additionalProperties": {"type": "string"},
            },
            "add_fields": {
                "title": "Добавить поля",
                "description": r'Формат JSON {"Целевое поле":"Константа",...}',
                "additionalProperties": {"type": "string"},
            },
        },
    }
    processor.add_params_input(schema=schema)
    processor.add_output(default_binding="some_data")

    def action(task: Task):
        params = task.get_params_reader().read_one()
        path = params["folder_path"] + "/" + params["file_path"]
        api_token = params["api_token"]
        file_data = yandex_disk.download_file(api_token, path)
        df = get_data_frame_func(file_data)
        df = data_frame.clear_column_names(df)
        if "select_fields" in params:
            df = data_frame.select_columns(df, params["select_fields"])
        if "add_fields" in params:
            df = data_frame.add_columns_with_const_values(df, params["add_fields"])
        df = df.drop_duplicates()
        items = df.to_dict("records")
        writer = task.get_writer()
        writer.clear()
        writer.write_many(items)
        writer.close()

    processor.set_action(action)
