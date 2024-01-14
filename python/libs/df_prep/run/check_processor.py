from df_prep import (
    Processor,
    ProcessorParams,
    ProcessorParam,
    DbWriter,
    DbConnection,
    Database,
    config
)


class DummyProcessorParams(ProcessorParams):
    def __init__(self):
        self.fileName = ProcessorParam[str](title="Имя файла")
        self.target = ProcessorParam[DbWriter](title="Целевая коллекция")


class DummyProcessor(Processor[DummyProcessorParams]):
    def __init__(self):
        self.title = "Входящий коннектора (Пример)"
        self.description = "Пример входящего коннектора"

    def run(self, params):
        print(params.fileName.title, ":", params.fileName.value)
        print(params.target.title, ":", params.target.value.name)
        # print(params.to_dict())

config.db_connection_string = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
config.db_name = "test"

pars = DummyProcessorParams()
pars.fileName.value = r"C:\Users\andre\YandexDisk\Notes\Desktop\Выгрузка по ТУ.xlsx"
pars.target.value = DbWriter("incoming_data")
processor = DummyProcessor()
processor.run(pars)
