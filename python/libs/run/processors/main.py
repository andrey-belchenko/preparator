from df_prep import Module
from run.processors.common.input import input_ya_disk_excel
from run.processors.common.input import input_ya_disk_csv
from run.processors.siber import clear_rs_data, match_substation

def create_module():
    module = Module()
    input_ya_disk_excel.create(module)
    input_ya_disk_csv.create(module)
    clear_rs_data.create(module)
    match_substation.create(module)
    return module
