from datetime import datetime
from typing import Any, Optional
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
        schema: Optional[Any] = None

    name: str
    project: str
    module: str
    defined_in_file: str
    title: Optional[str] = None
    description: Optional[str] = None
    inputs: list[PortInfo]
    outputs: list[PortInfo]
