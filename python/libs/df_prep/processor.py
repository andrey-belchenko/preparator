from __future__ import annotations
import enum
import os
from types import ModuleType
from typing import Any, Callable, TYPE_CHECKING, List, Union
from .storage import (
    DatabaseInfo,
    ConnectionInfo,
    DbReader,
    DbWriter,
    MemoryReader,
    MemoryWriter,
)
import inspect
from pymongo.database import Database as MongoDatabase

# todo replace print with logging


class Project:
    modules: dict[str, Module]
    _debug_db: DatabaseInfo

    def __init__(self, name):
        self.modules = {}
        self._debug_db = None
        self.name = name

    def set_connection(self, connection_string: str, database_name: str):
        self._debug_db = DatabaseInfo(database_name, ConnectionInfo(connection_string))

    def _get_debug_db(self):
        return self._debug_db

    def add_module(self, module: Module):
        if module.name in self.modules:
            raise Exception(f"duplicated module name '{module.name}'")
        self.modules[module.name] = module
        module.project = self

    def get_module(self, info: str | ModuleType):
        if isinstance(info, str):
            name = info
        else:
            name = info.__name__.rsplit(".", 1)[-1]
        if name not in self.modules:
            raise Exception(f"module '{name}' is not defined")
        return self.modules[name]

    def add_modules(self, modules: list[Module]):
        for item in modules:
            self.add_module(item)


class Port:
    def __init__(
        self,
        name: str,
        title: str = None,
        description: str = None,
        default_binding: str = None,
        read_only: bool = False,
        schema: Any = None,
    ):
        self.name = name
        self.title = title
        self.description = description
        self.default_binding = default_binding
        self.read_only = read_only
        self.schema = schema


def _default_action(params: Task):
    print(f"Processor {params.processor.name} has no action defined")


def _get_source_file_name():
    caller_frame = inspect.stack()[2]
    return (
        caller_frame.filename
        # .replace(os.getcwd(), "")
        .replace("\\", "/")
        # .rstrip("/")[1:]
    )


def _get_name_from_path(path):
    return path.rsplit("/", 1)[-1].split(".", 1)[0]


class Module:
    project: Project

    def __init__(self, name: str = None):
        self.defined_in_file = _get_source_file_name()
        if name == None:
            name = _get_name_from_path(self.defined_in_file)
        self.name = name
        self.processors = dict[str, Processor]()
        self.project = None

    def add_processor(self, processor: Processor):
        if processor.name in self.processors:
            raise Exception(f"duplicated processor name '{processor.name}'")
        self.processors[processor.name] = processor
        processor.module = self

    def add_processors(self, processors: list[Processor]):
        for processor in processors:
            self.add_processor(processor)

    def get_processor(self, info: str | ModuleType):
        name = ""
        if isinstance(info, str):
            name = info
        else:
            name = info.__name__.rsplit(".", 1)[-1]
        if name not in self.processors:
            raise Exception(f"processor '{name}' is not defined")
        return self.processors[name]

    def create_task(self, processor_info: str | ModuleType):
        return self.get_processor(processor_info).create_task()


class Processor:
    module: Module

    def __init__(self, title: str = None, description: str = None, name: str = None):
        self.defined_in_file = _get_source_file_name()
        if name == None:
            name = _get_name_from_path(self.defined_in_file)
        self.name = name
        self.title = title
        self.description = description
        self.inputs = dict[str, Port]()
        self.outputs = dict[str, Port]()
        self.action = _default_action
        self.module = None

    def add_named_input(
        self,
        name: str,
        title: str = None,
        description: str = None,
        schema: dict[str, Any] = None,
        default_binding: str = None,
        read_only: bool = False,
    ):
        item = Port(name, title, description, default_binding, read_only, schema)
        if name in self.inputs:
            raise Exception(f"duplicated input name {name} in processor {self.name}")
        self.inputs[name] = item

    def add_named_output(
        self,
        name: str,
        title: str = None,
        description: str = None,
        schema: dict[str, Any] = None,
        default_binding: str = None,
        read_only: bool = False,
    ):
        item = Port(name, title, description, default_binding, read_only, schema)
        if name in self.outputs:
            raise Exception(f"duplicated output name {name} in processor {self.name}")
        self.outputs[name] = item

    def add_input(
        self,
        title: str = "Вход",
        description: str = None,
        schema: dict[str, Any] = None,
        default_binding: str = None,
        read_only: bool = False,
    ):
        self.add_named_input(
            "default", title, description, schema, default_binding, read_only
        )

    def add_params_input(
        self,
        title: str = "Параметры",
        description: str = None,
        schema: dict[str, Any] = None,
    ):
        self.add_named_input("params", title, description, schema)

    def add_output(
        self,
        title: str = "Выход",
        description: str = None,
        schema: dict[str, Any] = None,
        default_binding: str = None,
        read_only: bool = False,
    ):
        self.add_named_output(
            "default", title, description, schema, default_binding, read_only
        )

    def set_action(self, action: Callable[[str], None]):
        self.action = action

    def create_task(self) -> Task:
        return Task(self)


class Task:
    _database: DatabaseInfo

    def __init__(self, processor: Processor):
        self.processor = processor
        self._input_binding = dict[str, str | list[dict[str, Any]] | dict[str, Any]]()
        self._output_binding = dict[str, str | str | list[dict[str, Any]]]()
        self._writers = dict[str, DbWriter | MemoryWriter]()
        self._readers = dict[str, DbReader | MemoryReader]()
        self._database = None

    # Config

    def _remove_input_binging(self, name: str):
        if name in self._input_binding:
            del self._input_binding[name]

    def _remove_output_binging(self, name: str):
        if name in self._output_binding:
            del self._output_binding[name]

    def bind_named_input(
        self, input_name: str, source: list[dict[str, Any]] | dict[str, Any] | str
    ):
        self._remove_input_binging(input_name)
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        if isinstance(source, list):
            source = source.copy()
        self._input_binding[input_name] = source

    def bind_named_output(self, output_name: str, target: list[dict[str, Any]] | str):
        self._remove_output_binging(output_name)
        if not output_name in self.processor.outputs:
            raise Exception(f"Output '{output_name}' is not declared")
        self._output_binding[output_name] = target

    def bind_params(self, source: list[dict[str, Any]] | dict[str, Any] | str):
        self.bind_named_input("params", source)

    def bind_input(self, source: list[dict[str, Any]] | dict[str, Any] | str):
        self.bind_named_input("default", source)

    def bind_output(self, target: list[dict[str, Any]] | str):
        self.bind_named_output("default", target)

    def bind_inputs(
        self,
        input_bindings: dict[str, Union[str, List[dict[str, Any]], dict[str, Any]]],
    ):
        for name in input_bindings:
            self.bind_named_input(name, input_bindings[name])

    def bind_outputs(
        self, output_bindings: dict[str, Union[str, List[dict[str, Any]]]]
    ):
        for name in output_bindings:
            self.bind_named_output(name, output_bindings[name])

    def _print_bindings(self, ports: dict, bindings: dict):
        for name in ports:
            val = None
            if name in bindings:
                val = bindings[name]
            text = ""
            if val == None:
                text = "null"
            elif isinstance(val, str):
                text = val
            elif isinstance(val, dict):
                text = str(val)
            else:
                text = "list[]"
            print("- " + name + ": " + text)

    def _apply_default_binding(self):
        def apply(ports: dict[str, Port], bindings: dict, type: str):
            for name in ports:
                if name not in bindings:
                    port = ports[name]
                    if port.default_binding != None:
                        bindings[name] = port.default_binding
            for name in bindings:
                if name not in ports:
                    raise Exception(
                        f"Invalid binding. Processor '{self.processor.name}' does not contain {type} '{name}'"
                    )

        apply(self.processor.inputs, self._input_binding, "input")
        apply(self.processor.outputs, self._output_binding, "output")

    def get_input_binding_info(self):
        return self._input_binding.copy()

    def get_output_binding_info(self):
        return self._output_binding.copy()

    def prepare(self):
        self._apply_default_binding()

    def run(self):
        print("")
        print(f"Start processor '{self.processor.name}' task")
        self.prepare()
        print("input binding")
        self._print_bindings(self.processor.inputs, self._input_binding)
        print("")
        print("output binding")
        self._print_bindings(self.processor.outputs, self._output_binding)
        print("")
        task_context = self  # TaskContext(self)
        self.processor.action(task_context)
        for name in task_context._writers:
            if not task_context._writers[name].is_closed():
                raise Exception(
                    f"Writer '{name}' in processor '{self.processor.name}' was not closed. Use writer.close() when writing is finished"
                )

        print(f"Processor '{self.processor.name}' task finished")
        print("")

    def get_input_count(self, name):
        return self._readers[name].get_count()

    def get_output_count(self, name):
        return self._writers[name].get_count()

    # Exec

    def set_connection(self, connection_string: str, database_name: str):
        self._database = DatabaseInfo(connection_string, ConnectionInfo(database_name))

    def _get_database(self):
        if self._database != None:
            return self._database
        return self.processor.module.project._get_debug_db()

    def set_database(self, value: MongoDatabase):
        self._database = DatabaseInfo(instance=value)

    def get_named_reader(self, input_name: str) -> DbReader | MemoryReader:
        if not input_name in self.processor.inputs:
            raise Exception(f"Input '{input_name}' is not declared")
        source = self._input_binding[input_name]
        if isinstance(source, str):
            val = DbReader(source, self._get_database())
        else:
            if isinstance(source, dict):
                source = [source]
            val = MemoryReader(source)
        self._readers[input_name] = val
        return val

    def get_named_writer(self, output_name: str) -> DbWriter:
        if not output_name in self.processor.outputs:
            raise Exception(f"Output '{output_name}' is not declared")
        target = self._output_binding[output_name]
        if not output_name in self._writers:
            if isinstance(target, str):
                val = DbWriter(target, self._get_database())
            else:
                if isinstance(target, dict):
                    target = [target]
                val = MemoryWriter(target)
            self._writers[output_name] = val
        return self._writers[output_name]

    def get_reader(self) -> DbReader | MemoryReader:
        return self.get_named_reader("default")

    def get_params_reader(self) -> DbReader | MemoryReader:
        return self.get_named_reader("params")

    def get_writer(self) -> DbWriter:
        return self.get_named_writer("default")


# class TaskContext:
#     def __init__(self, task: Task):
#         self.task = task
#         self._writers = dict[str, DbWriter | MemoryWriter]()
