from df_prep import Processor, ProcessorParams, ProcessorParam, DbWriter, Secret
from run.utils import yandex_disk
import pandas as pd

class ExampleProcessorParams(ProcessorParams):
    def __init__(self):
        self.filePath = ProcessorParam[str](
            title="Путь к файлу",
            description="Относительный путь от корневой папки Яндекс Диска",
        )
        self.token = ProcessorParam[Secret](
            title="API Токен Яндекс Диск",
            description="Получить токен можно на странице https://yandex.ru/dev/disk/poligon/",
        )
        self.target = ProcessorParam[DbWriter](title="Целевая коллекция")


class ExampleProcessor(Processor[ExampleProcessorParams]):
    def __init__(self):
        self.title = "Входящий коннектор. Яндекс Диск. Excel файл"
        self.description = "Читает Excel файл из яндекс диска и записывает данные 1-го листа в коллекцию. 1-я строка содержит заголовки полей"

    
    def action(self, params):
        data = yandex_disk.download_file(
            params.token.value.value, params.filePath.value
        )
        excel_file = pd.read_excel(data)
        items = excel_file.to_dict('records')

        for dict_row in items:
            print(dict_row)
