from df_prep import Processor, ProcessorParams, ProcessorParam, DbWriter, Secret
from run.utils import yandex_disk
import pandas as pd


class YandexDiskExcelProcessorParams(ProcessorParams):
    def __init__(self):
        self.filePath = ProcessorParam[str](
            title="Путь к файлу",
            description="Относительный путь от корневой папки Яндекс Диска",
        )
        self.apiToken = ProcessorParam[Secret](
            title="Токен для доступа к API Яндекс Диск",
            description="Получить токен можно на странице https://yandex.ru/dev/disk/poligon/",
        )
        self.target = ProcessorParam[DbWriter](title="Целевая коллекция")


class YandexDiskExcelProcessor(Processor[YandexDiskExcelProcessorParams]):
    def __init__(self):
        self.title = "Входящий коннектор. Яндекс Диск. Excel файл"
        self.description = "Читает Excel файл из Яндекс Диска и записывает данные 1-го листа в коллекцию (предварительно коллекция зачищается). 1-я строка файла содержит заголовки полей."

    def action(self, params):
        file_data = yandex_disk.download_file(
            params.apiToken.get().value, params.filePath.get()
        )
        excel_file = pd.read_excel(file_data)
        items = excel_file.to_dict("records")
        params.target.get().insert_many(items)
        print(
            f"File {params.filePath.get()} data loaded into '{params.target.get().name}' collection"
        )
