import os
from main import create_module


module = create_module()
module.db_con_str = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
module.db_name = "bav_test"


ya_disk_params = {
    "folder_path": "МРСК\Разное\Пример данных для загрузки\siberia",
    "api_token": "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8",
}


def load_supa_data(file_name, collection_name):
    task = module.get_processor("ya_disk_excel_input").create_task()
    ya_disk_params["file_path"] = file_name
    task.set_params_input_data(ya_disk_params)
    task.set_default_output_collection(collection_name)
    task.run()


def load_rs_data(file_name, collection_name, columns):
    task = module.get_processor("ya_disk_csv_input").create_task()
    params = ya_disk_params.copy()
    params["columns"] = columns
    params["file_path"] = file_name
    task.set_params_input_data(params)
    task.set_default_output_collection(collection_name)
    task.run()

load_supa_data("Substation_supa.xlsx", "Substation_supa_input")
load_rs_data(
    "Substation_rs.csv",
    "Substation_rs_input",
    {
        "IRI": "Uid",
        "name": "name",
        "Region": "Substations",
    },
)
