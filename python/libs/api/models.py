from datetime import datetime
import enum
from typing import Any, List, Optional, Union
from pydantic import BaseModel


class ProjectInfo(BaseModel):
    class VersionInfo(BaseModel):
        repository: str
        branch: str
        commit: str
        is_dirty: bool

    name: str
    changed_at: datetime
    deployment_id: str
    main_file_path: str
    main_func_name: str
    published_by: str
    version_info: Optional[VersionInfo] = None
    deployment_id: str


class ModuleInfo(BaseModel):
    name: str
    project: str
    defined_in_file: str


class ProcessorInfo(BaseModel):
    class PortInfo(BaseModel):
        name: str
        read_only: bool
        title: Optional[str] = None
        description: Optional[str] = None
        data_schema: Optional[Any] = None
        default_binding: Optional[str] = None

    name: str
    project: str
    module: str
    defined_in_file: str
    title: Optional[str] = None
    description: Optional[str] = None
    inputs: list[PortInfo]
    outputs: list[PortInfo]


class TaskRequest(BaseModel):
    # class Binding(BaseModel):
    #     name: str
    #     value: Union[str, List[Any], Any]

    is_async: bool
    input_bindings: dict[str, Union[str, List[Any], Any]]
    output_bindings: dict[str, Union[str, List[Any], Any]]


class TaskInfo(BaseModel):
    class TaskStatus(enum.Enum):
        RUNNING = "RUNNING"
        SUCCEEDED = "SUCCEEDED"
        FAILED = "FAILED"

    module: str
    processor: str
    id: str
    status: TaskStatus
    # task_request: TaskRequest
