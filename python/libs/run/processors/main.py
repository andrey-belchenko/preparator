from df_prep import Module
from run.processors.common.input import input_ya_disk_excel
from run.processors.common.input import input_ya_disk_csv
from run.processors.siber import clear_rs_data, match_substation, match_voltage_level


def create_module():
    module = Module()
    input_ya_disk_excel.create(module)
    input_ya_disk_csv.create(module)
    clear_rs_data.create(module)
    match_substation.create(module)
    match_voltage_level.create(module)
    return module


def create_modules():
    return [create_module()]
