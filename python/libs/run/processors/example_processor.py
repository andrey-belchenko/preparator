from df_prep import (
    Processor,
    ProcessorParams,
    ProcessorParam,
    DbWriter,
)


class ExampleProcessorParams(ProcessorParams):
    def __init__(self):
        self.fileName = ProcessorParam[str](title="Имя файла")
        self.target = ProcessorParam[DbWriter](title="Целевая коллекция")


class ExampleProcessor(Processor[ExampleProcessorParams]):
    def __init__(self):
        self.title = "Входящий коннектор (Пример)"
        self.description = "Пример входящего коннектора"

    def action(self, params):
        print(params.fileName.title, ":", params.fileName.value)
        print(params.target.title, ":", params.target.value.name)



