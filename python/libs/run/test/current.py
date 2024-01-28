# from __future__ import annotations
# import enum
# import os
# from types import ModuleType
# from typing import Any, Callable, TYPE_CHECKING
# from .storage import (
#     DatabaseInfo,
#     ConnectionInfo,
#     DbReader,
#     DbWriter,
#     MemoryReader,
#     MemoryWriter,
# )
# import inspect


# class Project:
#     modules: dict[str, Module]
#     def __init__(self, name):
#         self.modules = {}
#         self._debug_db = None
#         self.name = name

    
# class PortInfo:
#     def __init__(
#         self,
#         name: str,
#         title: str = None,
#         description: str = None,
#         default_binding: str = None,
#         read_only: bool = False,
#         schema: Any = None,
#     ):
#         self.name = name
#         self.title = title
#         self.description = description
#         self.default_binding = default_binding
#         self.read_only = read_only
#         self.schema = schema

# class Module:
#     project: Project

#     def __init__(self, name: str = None):
#         self.defined_in_file = ""
#         self.name = name
#         self.processors = dict[str, Processor]()
#         self.project = None

# class Processor:
#     module: Module
#     def __init__(self, title: str = None, description: str = None, name: str = None):
#         self.defined_in_file =  ""
#         self.name = name
#         self.title = title
#         self.description = description
#         self.inputs = list[PortInfo]
#         self.outputs = list[PortInfo]
#         self.module = None



    



