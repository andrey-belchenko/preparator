from os import path
import os
from typing import List, Union
from pyparsing import Any
from api.mongo import get_sys_db

from df_prep.deployment import extract


def run_task(
    workspace: str,
    project_name: str,
    module_name: str,
    processor_name: str,
    input_bindings: dict[str, Union[str, List[Any], Any]],
    output_bindings: dict[str, Union[str, List[Any], Any]],
    is_async: bool,
):
    download_project(workspace, project_name)


def get_dynamic_path(project_name):
    return path.join(os.path.dirname(__file__, "dynamic", project_name))


def download_project(workspace: str, project_name: str):
    extract.download_project(
        workspace, get_sys_db(), project_name, get_dynamic_path(project_name)
    )
