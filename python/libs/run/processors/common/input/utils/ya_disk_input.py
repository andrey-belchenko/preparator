import pandas as pd
from df_prep.processor import Task
from run.utils import data_frame, yandex_disk


input_params_schema = {
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


def action(task: Task, get_data_frame_func):
    params = task.get_input_reader("params").read_one()
    file_path = params["folder_path"] + "/" + params["file_path"]
    api_token = params["api_token"]
    file_data = yandex_disk.download_file(api_token, file_path)
    df = get_data_frame_func(file_data)
    df = data_frame.clear_column_names(df)
    columns = params["columns"]
    if columns != None:
        df = data_frame.select_columns(df, columns)
    items = df.to_dict("records")
    output_writer = task.get_output_writer("output")
    output_writer.clear()
    output_writer.write_many(items)
    print(f"file {file_path} data loaded into '{output_writer.name}' collection")
