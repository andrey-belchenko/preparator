from df_prep import Module, Project
from run.processors.common.input import input_ya_disk_excel
from run.processors.common.input import input_ya_disk_csv
from run.processors.siber import clear_rs_data, match_substation, match_voltage_level


def create_module_common():
    module = Module("common")
    module.add_processors(
        [
            input_ya_disk_excel.create(),
            input_ya_disk_csv.create(),
        ]
    )
    return module


def create_module_siber():
    module = Module("siber")
    module.add_processors(
        [
            clear_rs_data.create(),
            match_substation.create(),
            match_voltage_level.create(),
        ]
    )
    return module


def create_project():
    project = Project()
    project.add_modules([create_module_common(), create_module_siber()])
    return project
