import pandas as pd
from df_prep.processor import Module, Processor, Task
from run.utils import data_frame, yandex_disk


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
            "columns": {"additionalProperties": {"type": "string"}},
        },
    }
    processor.add_params_input(schema=schema)
    processor.add_default_output()

    def action(task: Task):
        params = task.get_params_reader().read_one()
        file_path = params["folder_path"] + "/" + params["file_path"]
        api_token = params["api_token"]
        file_data = yandex_disk.download_file(api_token, file_path)
        df = get_data_frame_func(file_data)
        df = data_frame.clear_column_names(df)
        if "columns" in params:
            df = data_frame.select_columns(df, params["columns"])
        items = df.to_dict("records")
        output_writer = task.get_default_output_writer()
        output_writer.clear()
        output_writer.write_many(items)
        print(f"file {file_path} data loaded into '{output_writer.name}' collection")

    processor.set_action(action)
