from __future__ import annotations
import enum
import os
from typing import Any, Callable, TYPE_CHECKING
from .storage import Database, DbConnection, DbReader, DbWriter, MemoryReader
import inspect


# class ParamType(enum.Enum):
#     STRING = "string"
#     SECRET = "secret"
#     NUMBER = "number"


# class Param:
#     def __init__(
#         self,
#         name: str,
#         type: ParamType = ParamType.STRING,
#         title: str = None,
#         description: str = None,
#     ):
#         self.name = name
#         self.type = type
#         self.title = title
#         self.description = description


class PortInfo:
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
    return (
        caller_frame.filename.replace(os.getcwd(), "")
        .replace("\\", "/")
        .rstrip("/")[1:]
    )


class Module:
    def __init__(self):
        self.defined_in_file = _get_source_file_name()
        self.processors = dict[str, Processor]()
        self.db_con_str = ""
        self.db_name = ""

    def create_processor(self, title=None, description=None):
        processor = Processor(self, title, description)
        if processor.name in self.processors:
            raise Exception(f"duplicated processor name '{processor.name}'")
        self.processors[processor.name] = processor
        return processor

    def get_processor(self, info: str | Module):
        name = ""
        if isinstance(info, str):
            name = info
        else:
            name = info.__name__.rsplit(".", 1)[-1]
        if name not in self.processors:
            raise Exception(f"processor '{name}' is not defined")
        return self.processors[name]


class Processor:
    def __init__(self, module: Module, title=None, description=None):
        self.defined_in_file = _get_source_file_name()
        self.name = self.defined_in_file.rsplit("/", 1)[-1].split(".", 1)[0]
        self.title = title
        self.description = description
        self.inputs = dict[str, PortInfo]()
        self.outputs = dict[str, PortInfo]()
        self.action = _default_action
        self.module = module

    def add_named_input(
        self,
        name: str,
        title: str = None,
        description: str = None,
        schema: dict[str, Any] = None,
    ):
        item = PortInfo(name, title, description)
        if name in self.inputs:
            raise Exception(f"duplicated input name {name} in processor {self.name}")
        self.inputs[name] = item
        self.schema = schema

    def add_default_input(
        self,
        title: str = "Вход",
        description: str = None,
        schema: dict[str, Any] = None,
    ):
        self.add_named_input("default", title, description, schema)

    def add_params_input(
        self,
        title: str = "Параметры",
        description: str = None,
        schema: dict[str, Any] = None,
    ):
        self.add_named_input("params", title, description, schema)

    def add_named_output(
        self,
        name: str,
        title: str = None,
        description: str = None,
    ):
        item = PortInfo(name, title, description)
        if name in self.inputs:
            raise Exception(f"duplicated output name {name} in processor {self.name}")
        self.outputs[name] = item

    def add_default_output(
        self,
        title: str = "Выход",
        description: str = None,
        schema: dict[str, Any] = None,
    ):
        self.add_named_output("default", title, description)

    def set_action(self, action: Callable[[str], None]):
        self.action = action

    def create_task(self) -> Task:
        return Task(self)


class Task:
    def __init__(self, processor: Processor):
        self.processor = processor
        self.inputBinding = dict[str, str]()
        self.inputData = dict[str, list[dict[str, Any]]]()
        self.outputBinding = dict[str, str]()

    def set_named_input_collection(self, input_name: str, collection_name: Any):
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        self.inputBinding[input_name] = collection_name

    def set_named_output_collection(self, output_name: str, collection_name: Any):
        if not output_name in self.processor.outputs:
            raise Exception(f"Output '{output_name}' is not declared")
        self.outputBinding[output_name] = collection_name

    def set_named_input_data(
        self, input_name: str, data: list[dict[str, Any]] | dict[str, Any]
    ):
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        if isinstance(data, dict):
            data = [data]
        self.inputData[input_name] = data

    def set_params_input_data(self, data: list[dict[str, Any]] | dict[str, Any]):
        self.set_named_input_data("params", data)

    def set_params_input_collection(self, collection_name: Any):
        self.set_named_input_collection("params", collection_name)

    def set_default_input_data(self, data: list[dict[str, Any]] | dict[str, Any]):
        self.set_named_input_data("default", data)

    def set_default_input_collection(self, collection_name: Any):
        self.set_named_input_collection("default", collection_name)

    def set_default_output_collection(self, collection_name: Any):
        self.set_named_output_collection("default", collection_name)

    def _get_database(self):
        return Database(
            self.processor.module.db_name,
            DbConnection(self.processor.module.db_con_str),
        )

    def get_named_input_reader(self, input_name: str) -> DbReader | MemoryReader:
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        if input_name in self.inputBinding:
            return DbReader(self.inputBinding[input_name], self._get_database())
        elif input_name in self.inputData:
            return MemoryReader(self.inputData[input_name])
        else:
            raise Exception(f"Input '{input_name}' is not bound")

    def get_default_output_reader(self) -> DbReader | MemoryReader:
        return self.get_named_input_reader("default")

    def get_params_reader(self) -> DbReader | MemoryReader:
        return self.get_named_input_reader("params")

    def get_named_output_writer(self, output_name: str) -> DbWriter:
        if not output_name in self.processor.outputs:
            raise Exception(f"Output '{output_name}' is not declared")
        if output_name in self.outputBinding:
            return DbWriter(self.outputBinding[output_name], self._get_database())
        else:
            raise Exception(f"Output '{output_name}' is not bound")

    def get_default_output_writer(self) -> DbWriter:
        return self.get_named_output_writer("default")

    def run(self):
        print(f"Start processor {self.processor.name} task")
        print(f"inputBinding:{self.inputBinding}")
        print(f"inputData:{self.inputData}")
        print(f"outputBinding:{self.outputBinding}")
        self.processor.action(self)
        print(f"Processor {self.processor.name} task finished")
