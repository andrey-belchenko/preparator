from df_prep import (
    Processor,
    ProcessorParams,
    ProcessorParam,
    DbWriter,
    DbReader,
    Secret,
)
from df_prep.classes.storage import DbReader
from run.utils import yandex_disk
import pandas as pd


class StringsNormalizerParams(ProcessorParams):
    def __init__(self):
        self.source = ProcessorParam[DbReader](title="Коллекция источник")
        self.target = ProcessorParam[DbWriter](title="Целевая коллекция")


class StringsNormalizer(Processor[StringsNormalizerParams]):
    def __init__(self):
        self.title = "Нормализация строк"
        self.description = "Удаление лишних пробелов, табуляции и переводов строки во всех полях коллекции"

    def action(self, params):
        items = params.source.get().read_all()
        # todo реализовать логику обработки и вставку порциями
        params.target.get().write_many(items)
        
