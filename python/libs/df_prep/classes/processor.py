from typing import TypeVar, Generic
from abc import ABC, abstractmethod



TParamType = TypeVar("TParamType")


class ProcessorParam(Generic[TParamType]):
    def __init__(
        self,
        value: TParamType = None,
        title: str = None,
        description: str = None,
        readOnly: bool = False,
    ):
        self.title = title
        self.description = description
        self.value = value
        self.readOnly = readOnly


# class StringParam(ProcessorParam[str]):
#     def __init__(self, value=None, title: str = None, description: str = None):
#         super().__init__(value, title, description)


# class DbReaderParam(ProcessorParam[DbReader]):
#     def __init__(self, value=None, title: str = None, description: str = None):
#         super().__init__(value, title, description)


# class DbWriterParam(ProcessorParam[DbWriter]):
#     def __init__(self, value=None, title: str = None, description: str = None):
#         super().__init__(value, title, description)


class ProcessorParams(ABC):
    def __init__(self):
        pass

    def to_dict(self):
        return vars(self)


TParams = TypeVar("TParams", bound=ProcessorParams)


class Processor(Generic[TParams], ABC):
    def __init__(self):
        self.title = ""
        self.description = ""

    def run(self, params: TParams):
        self.action(params)
        return params

    @abstractmethod
    def action(self, params: TParams):
        return params
