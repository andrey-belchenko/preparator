from df_prep import DbWriter, config
from processors.example_processor import ExampleProcessor, ExampleProcessorParams


config.db_connection_string = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
config.db_name = "test"

pars = ExampleProcessorParams()
pars.fileName.value = r"C:\Users\andre\YandexDisk\Notes\Desktop\Выгрузка по ТУ.xlsx"
pars.target.value = DbWriter("incoming_data")
processor = ExampleProcessor()
processor.run(pars)
