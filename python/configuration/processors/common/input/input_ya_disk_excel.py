from processors.utils import excel
from dpt import Module, Processor
from .utils import input_ya_disk


def create():
    processor = Processor(
        title="Входящий коннектор. Яндекс Диск. Excel файл",
        description="Читает Excel файл из Яндекс Диска и записывает данные 1-го листа в коллекцию (предварительно коллекция зачищается). 1-я строка файла содержит заголовки полей.",
    )

    input_ya_disk.configure(processor, excel.read_excel)
    return processor
