from run.processors import yandex_disk_excel
from df_prep import system

system.db_connection_string = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
system.db_name = "test"
processor = system.get_processor("ya_disk_excel_input")
task = processor.create_task()
task.set_param("file_path", "МРСК/Разное/Пример данных для загрузки/Пример1.xlsx")
task.set_param(
    "api_token", "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8"
)
task.set_output("output", "incoming_data1")
task.run()
