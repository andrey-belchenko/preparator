from __future__ import annotations
import enum
from typing import Callable, TYPE_CHECKING

from df_prep.classes.storage import DbReader, DbWriter


if TYPE_CHECKING:
    from system import System


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


class Processor:
    system: System

    def __init__(self, name: str, title=None, description=None):
        self.name = name
        self.title = title
        self.description = description
        self.params = dict[str, Param]()
        self.inputs = dict[str, CollectionInfo]()
        self.outputs = dict[str, CollectionInfo]()
        self.action = _default_action

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
    ):
        item = CollectionInfo(name, title, description)
        if name in self.inputs:
            raise Exception(f"duplicated input name {name} in processor {self.name}")
        self.inputs[name] = item

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
        self.params = dict[str, any]()
        self.inputs = dict[str, str]()
        self.outputs = dict[str, str]()

    def set_param(self, name: str, value: any):
        self.params[name] = value

    def set_input(self, name: str, collection_name: any):
        self.params[name] = collection_name

    def set_output(self, name: str, collection_name: any):
        self.params[name] = collection_name

    def get_param(self, name: str):
        return self.params[name]

    def get_string_param(self, name: str) -> str:
        return self.get_param(name)

    def get_number_param(self, name: str) -> float:
        return self.get_param(name)

    def get_input_reader(self, name: str) -> DbReader:
        return DbReader(self.inputs[name])

    def get_output_writer(self, name: str) -> DbWriter:
        return DbWriter(self.inputs[name])

    def execute(self):
        self.processor.action(self)


def _default_action(params: Task):
    print(f"Processor {params.processor.name} has no action defined")


def action(params: Task):
    print("yep")
    print("done")


# processor = Processor("MyProc")
# processor.add_param("par1")
# processor.add_param("par2")

# processor.set_action(action)
# task = processor.create_task()
# task.execute()

# processor.execute(Task())
