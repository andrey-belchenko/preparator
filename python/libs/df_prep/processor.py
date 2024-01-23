from __future__ import annotations
import enum
import os
from typing import Any, Callable, TYPE_CHECKING
from .storage import Database, DbConnection, DbReader, DbWriter, MemoryReader
import inspect


class ParamType(enum.Enum):
    STRING = "string"
    SECRET = "secret"
    NUMBER = "number"


class Param:
    def __init__(
        self,
        name: str,
        type: ParamType = ParamType.STRING,
        title: str = None,
        description: str = None,
    ):
        self.name = name
        self.type = type
        self.title = title
        self.description = description


class CollectionInfo:
    def __init__(
        self,
        name: str,
        title: str = None,
        description: str = None,
    ):
        self.name = name
        self.title = title
        self.description = description


def _default_action(params: Task):
    print(f"Processor {params.processor.name} has no action defined")


def _get_source_file_name():
    caller_frame = inspect.stack()[3]
    return caller_frame.filename.replace(os.getcwd(), "").replace("\\", "/").rstrip("/")[1:]


class Module:
    def __init__(self):
        self.defined_in_file = _get_source_file_name()
        self.processors = dict[str, Processor]()
        self.db_con_str = ""
        self.db_name = ""

    def create_processor(self, name: str, title=None, description=None):
        if name in self.processors:
            raise Exception(f"duplicated processor name {name}")
        processor = Processor(self, name, title, description)
        self.processors[name] = processor
        return processor

    def get_processor(self, name: str):
        return self.processors[name]


class Processor:
    def __init__(self, module: Module, name: str, title=None, description=None):
        self.defined_in_file = _get_source_file_name()
        self.name = name
        self.title = title
        self.description = description
        self.params = dict[str, Param]()
        self.inputs = dict[str, CollectionInfo]()
        self.outputs = dict[str, CollectionInfo]()
        self.action = _default_action
        self.module = module

    def add_param(
        self,
        name: str,
        type: ParamType = ParamType.STRING,
        title: str = None,
        description: str = None,
    ):
        param = Param(name, type, title, description)
        if name in self.params:
            raise Exception(f"duplicated param name {name} in processor {self.name}")
        self.params[name] = param

    def add_input(
        self,
        name: str,
        title: str = None,
        description: str = None,
        schema: dict[str, Any] = None,
    ):
        item = CollectionInfo(name, title, description)
        if name in self.inputs:
            raise Exception(f"duplicated input name {name} in processor {self.name}")
        self.inputs[name] = item
        self.schema = schema

    def add_output(
        self,
        name: str,
        title: str = None,
        description: str = None,
    ):
        item = CollectionInfo(name, title, description)
        if name in self.inputs:
            raise Exception(f"duplicated output name {name} in processor {self.name}")
        self.outputs[name] = item

    def set_action(self, action: Callable[[str], None]):
        self.action = action

    def create_task(self) -> Task:
        return Task(self)


class Task:
    def __init__(self, processor: Processor):
        self.processor = processor
        # self.params = dict[str, any]()
        self.inputBinding = dict[str, str]()
        self.inputData = dict[str, list[dict[str, Any]]]()
        self.outputBinding = dict[str, str]()

    # def set_param(self, name: str, value: any):
    #     self.params[name] = value

    def set_input_collection(self, input_name: str, collection_name: Any):
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        self.inputBinding[input_name] = collection_name

    def set_output_collection(self, output_name: str, collection_name: Any):
        if not output_name in self.processor.outputs:
            raise Exception(f"Output '{output_name}' is not declared")
        self.outputBinding[output_name] = collection_name

    def set_input_data(
        self, input_name: str, data: list[dict[str, Any]] | dict[str, Any]
    ):
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        if isinstance(data, dict):
            data = [data]
        self.inputData[input_name] = data

    # def get_param(self, name: str):
    #     return self.params[name]

    # def get_string_param(self, name: str) -> str:
    #     return self.get_param(name)

    # def get_number_param(self, name: str) -> float:
    #     return self.get_param(name)

    def _get_database(self):
        return Database(
            self.processor.module.db_name,
            DbConnection(self.processor.module.db_con_str),
        )

    def get_input_reader(self, input_name: str) -> DbReader | MemoryReader:
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        if input_name in self.inputBinding:
            return DbReader(self.inputBinding[input_name], self._get_database())
        elif input_name in self.inputData:
            return MemoryReader(self.inputData[input_name])
        else:
            raise Exception(f"Input '{input_name}' is not bound")

    def get_output_writer(self, output_name: str) -> DbWriter:
        if not output_name in self.processor.outputs:
            raise Exception(f"Output '{output_name}' is not declared")
        if output_name in self.outputBinding:
            return DbWriter(self.outputBinding[output_name], self._get_database())
        else:
            raise Exception(f"Output '{output_name}' is not bound")

    def run(self):
        print(f"Start processor {self.processor.name} task")
        print(f"inputBinding:{self.inputBinding}")
        print(f"inputBinding:{self.inputData}")
        # print(f"params:{self.params}")
        print(f"outputBinding:{self.outputBinding}")
        self.processor.action(self)
        print(f"Processor {self.processor.name} task finished")


# class System:

#     def __init__(self):
#         self.processors = dict[str, any]()

#     def create_processor(self, name: str, title=None, description=None):
#         if name in self.processors:
#             raise Exception(f"duplicated processor name {name}")
#         processor = Processor(name, title, description)
#         self.processors[name] = processor
#         return processor
