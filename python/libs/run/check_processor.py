import os
from main import create_module
from run.processors.common.input import input_ya_disk_csv, input_ya_disk_excel
from run.processors.siber import clear_rs_data


module = create_module()
module.db_con_str = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
module.db_name = "bav_test"


ya_disk_params = {
    "folder_path": "МРСК\Разное\Пример данных для загрузки\siberia",
    "api_token": "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8",
}


def load_supa_data(file_name, collection_name):
    task = module.create_task(input_ya_disk_excel)
    ya_disk_params["file_path"] = file_name
    task.bind_params(ya_disk_params)
    task.bind_output(collection_name)
    task.run()


def load_rs_data(file_name, collection_name, selectFields, addFields=None):
    task = module.create_task(input_ya_disk_csv)
    params = ya_disk_params.copy()
    params["selectFields"] = selectFields
    params["addFields"] = addFields
    params["file_path"] = file_name
    task.bind_params(params)
    data = []
    task.bind_output(data)
    task.run()

    task = module.create_task(clear_rs_data)
    task.bind_input(data)
    task.bind_output(collection_name)
    task.run()



load_supa_data("Substation_supa.xlsx", "Substation_supa_input")
load_rs_data(
    "Substation_rs.csv",
    "Substation_rs_input",
    {
        "Uid": "IRI",
        "name": "name",
        "Region": "Region",
    },
    {"Класс": "Substation"},
)
