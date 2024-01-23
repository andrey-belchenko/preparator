import os
from main import create_module


module = create_module()
module.db_con_str = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
module.db_name = "bav_test"


ya_disk_params = {
    "folder_path": "МРСК\Разное\Пример данных для загрузки\siberia",
    "api_token": "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8",
}


# input_processor = module.get_processor("ya_disk_excel_input")
# input_task = input_processor.create_task()
# ya_disk_params["file_path"] = os.path.join(folder, "Substation_supa.xlsx")
# input_task.set_input_data("params", ya_disk_params)
# input_task.set_output_collection("output", "incoming_data1")
# input_task.run()


def load_supa_data(file_name, collection_name):
    input_processor = module.get_processor("ya_disk_excel_input")
    input_task = input_processor.create_task()
    ya_disk_params["file_path"] = file_name
    input_task.set_input_data("params", ya_disk_params)
    input_task.set_output_collection("output", collection_name)
    input_task.run()


load_supa_data("Substation_supa.xlsx", "Substation_supa")

# print(module.get_processor("ya_disk_excel_input").defined_in_file)


# processor = module.get_processor("string_normalizer")
# task = processor.create_task()
# task.set_input_collection("input", "incoming_data1")
# task.set_output_collepction("output", "processed_data")
# task.run()
