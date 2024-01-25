from df_prep import  TaskContext, Processor
import pandas as pd


def configure_common_ports(processor: Processor, class_name: str):
    processor.add_named_input("rs", "Данные РС", default_binding=f"{class_name}_rs")
    processor.add_named_input(
        "supa", "Данные СУПА", default_binding=f"{class_name}_supa"
    )
  
    processor.add_named_output(
        "matched", "Сопоставленные данные", default_binding=f"{class_name}_matched"
    )
    processor.add_named_output(
        "rs_unmatched",
        "Не сопоставленные РС",
        default_binding=f"{class_name}_rs_unmatched",
    )
    processor.add_named_output(
        "supa_unmatched",
        "Не сопоставленные СУПА",
        default_binding=f"{class_name}_supa_unmatched",
    )
    processor.add_named_output(
        "duplicates",
        "Не сопоставленные СУПА",
        default_binding=f"{class_name}_duplicates",
    )



