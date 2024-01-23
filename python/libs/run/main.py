from df_prep import Module
from processors.common.input import ya_disk_excel_input
from processors import string_normalizer

def create_module():
    module = Module()
    ya_disk_excel_input.create(module)
    string_normalizer.create(module)
    return module
