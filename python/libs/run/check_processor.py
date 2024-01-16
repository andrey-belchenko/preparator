from run.processors import ya_disk_excel_input
from run.processors import string_normalizer
from df_prep import system

system.db_connection_string = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
system.db_name = "test"


processor = system.get_processor("ya_disk_excel_input")
task = processor.create_task()
task.set_param("file_path", "МРСК/Разное/Пример данных для загрузки/Юр лица.XLSX")
task.set_param(
    "api_token", "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8"
)
task.set_output("output1", "incoming_data1")
task.run()


processor = system.get_processor("string_normalizer")
task = processor.create_task()
task.set_input("input1", "incoming_data1")
task.set_output("output1", "processed_data")
task.run()
