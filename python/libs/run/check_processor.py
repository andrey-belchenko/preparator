from df_prep import DbWriter, config
from processors.example_processor import (
    YandexDiskExcelProcessor,
    YandexDiskExcelProcessorParams,
    Secret,
)


config.db_connection_string = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
config.db_name = "test"

pars = YandexDiskExcelProcessorParams()

pars.filePath.set("МРСК/Разное/Пример данных для загрузки/Пример1.xlsx")
pars.apiToken.set(Secret("y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8"))
pars.target.set(DbWriter("incoming_data"))

processor = YandexDiskExcelProcessor()
processor.run(pars)
