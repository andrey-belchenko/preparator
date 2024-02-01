from processors.main import create_project
from processors.common.input import input_ya_disk_csv, input_ya_disk_excel
from processors.siber import clear_rs_data, match_substation, match_voltage_level


project = create_project()
project.set_connection(
    "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017", "bav_test3"
)

common_module = project.get_module("common")


task = common_module.create_task(input_ya_disk_excel)

task.bind_inputs(
    {
        "params": {
            "folder_path": "DataFabric\Прикладная разработка\Разное\Сибирь - Данные для сопоставления\data1",
            "api_token": "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8",
            "file_path": "Substation_supa.xlsx",
        }
    }
)
# task.bind_params()
task.bind_outputs({"default": "data_from_excel"})
task.run()
