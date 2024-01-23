from df_prep import Module
from run.processors.common.input import input_ya_disk_excel
from run.processors.common.input import input_ya_disk_csv
from processors import string_normalizer

def create_module():
    module = Module()
    input_ya_disk_excel.create(module)
    input_ya_disk_csv.create(module)
    string_normalizer.create(module)

    return module
