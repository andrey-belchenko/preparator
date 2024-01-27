from run.processors.main import create_project
from run.processors.common.input import input_ya_disk_csv, input_ya_disk_excel
from run.processors.siber import clear_rs_data, match_substation, match_voltage_level


project = create_project()
project.set_connection(
    "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017", "bav_test2"
)

common_module = project.get_module("common")
siber_module = project.get_module("siber")

ya_disk_params = {
    "folder_path": "DataFabric\Прикладная разработка\Разное\Сибирь - Данные для сопоставления\data1",
    "api_token": "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8",
}


def load_supa_data(file_name, collection_name):
    task = common_module.create_task(input_ya_disk_excel)
    ya_disk_params["file_path"] = file_name
    task.bind_params(ya_disk_params)
    task.bind_output(collection_name)
    task.run()


def load_rs_data(file_name, collection_name, selectFields, addFields=None):
    task = common_module.create_task(input_ya_disk_csv)
    params = ya_disk_params.copy()
    params["selectFields"] = selectFields
    params["addFields"] = addFields
    params["file_path"] = file_name
    task.bind_params(params)
    data = []
    task.bind_output(data)
    task.run()

    task = siber_module.create_task(clear_rs_data)
    task.bind_input(data)
    task.bind_output(collection_name)
    task.run()


def load_data_from_files():
    load_supa_data("Substation_supa.xlsx", "Substation_supa")
    load_rs_data(
        "Substation_rs.csv",
        "Substation_rs",
        {
            "Uid": "IRI",
            "name": "name",
            "Substations": "Region",
        },
        {"Класс": "Substation"},
    )

    # load_supa_data("VoltageLevel_supa.xlsx", "VoltageLevel_supa")
    # load_rs_data(
    #     "VoltageLevel_rs.csv",
    #     "VoltageLevel_rs",
    #     {
    #         "Uid": "_id|R",
    #         "name": "IdentifiedObject.name|R",
    #         "Класс": "class|R",
    #         "Substation_Uid": "VoltageLevel.Substation|R",
    #         "Substation_name": "IdentifiedObject.name|R-Sub",
    #     },
    # )


def run_matching():
    siber_module.create_task(match_substation).run()
    # siber_module.create_task(match_voltage_level).run()


# load_data_from_files()
# run_matching()

print(siber_module.get_processor(match_substation).defined_in_file)