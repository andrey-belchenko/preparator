from datetime import datetime
from pydantic import BaseModel


class Project(BaseModel):
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
    version_info: VersionInfo
    deployment_id: str
