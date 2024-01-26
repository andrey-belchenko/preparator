from df_prep import Module
from run.processors.common.input import input_ya_disk_excel
from run.processors.common.input import input_ya_disk_csv
from run.processors.siber import clear_rs_data, match_substation, match_voltage_level


def create_module():
    module = Module()
    module.add_processors(
        [
            input_ya_disk_excel.create(),
            input_ya_disk_csv.create(),
            clear_rs_data.create(),
            match_substation.create(),
            match_voltage_level.create(),
        ]
    )
    return module


def create_modules():
    return [create_module()]
