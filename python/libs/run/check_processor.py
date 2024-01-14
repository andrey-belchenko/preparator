from df_prep import DbWriter, config
from processors.example_processor import ExampleProcessor, ExampleProcessorParams, Secret


config.db_connection_string = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
config.db_name = "test"

pars = ExampleProcessorParams()
pars.filePath.value = r"C:\Users\andre\YandexDisk\Notes\Desktop\Выгрузка по ТУ.xlsx"
pars.target.value = DbWriter("incoming_data")
pars.filePath.value = "МРСК/Разное/Пример данных для загрузки/Пример1.xlsx"
pars.token.value = Secret("y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8")
processor = ExampleProcessor()
processor.run(pars)
