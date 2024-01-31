import asyncio
from os import path
import os
from typing import List, Union
from pyparsing import Any
from api.mongo import get_db, get_sys_db
from api import mongo
from df_prep.deployment.deploy import run_main_function
from df_prep.deployment.extract import download_project
from df_prep.processor import Project, Task

_projects_by_workspace = dict[str, dict[str, Project]]()





async def run_task(
    workspace: str,
    project_name: str,
    module_name: str,
    processor_name: str,
    input_bindings: dict[str, Union[str, List[Any], Any]],
    output_bindings: dict[str, Union[str, List[Any], Any]],
    is_async: bool,
):
    await _refresh_project_source_if_need(workspace, project_name)
    project = await _get_project(workspace, project_name)
    module = project.get_module(module_name)
    task = module.create_task(processor_name)
    task.bind_inputs(input_bindings)
    task.bind_outputs(output_bindings)
    task.set_database(get_db(workspace))
    if is_async:
        asyncio.create_task(
            _process_task(task)
        )
    else:
        await _process_task(task)

async def _process_task(task: Task):
    # task = tasks[task_id]
    try:
        task.run()
        # result = f"Processed data: {data}"
        # task.status = "SUCCEEDED"
        # task.result = result
    except Exception as e:
        # task.status = "FAILED"
        # task.error = str(e)
        pass
    finally:
        pass
        # tasks[task_id] = task  # Update task status
    
def _get_proj_path(workspace, project_name):
    return path.join(os.path.dirname(__file__), "dynamic", workspace, project_name)


def _get_proj_info_path(workspace, project_name):
    return path.join(_get_proj_path(workspace, project_name), "deployment_id.txt")


def _get_deployment_id(workspace, project_name):
    file_path = _get_proj_info_path(workspace, project_name)
    if os.path.exists(file_path):
        with open(file_path, "r") as file:
            return file.read()


def _set_deployment_id(workspace, project_name, value):
    with open(_get_proj_info_path(workspace, project_name), "w") as file:
        file.write(value)


lock = asyncio.Lock()


async def _get_project(workspace: str, project_name: str):
    async with lock:
        return _projects_by_workspace[workspace][project_name]


async def _refresh_project_source_if_need(workspace: str, project_name: str):
    async with lock:
        project_info = mongo.get_project(workspace, project_name)
        new_deployment_id = project_info["deployment_id"]
        old_deployment_id = _get_deployment_id(workspace, project_name)
        proj_path = _get_proj_path(workspace, project_name)
        changed = False
        if old_deployment_id != new_deployment_id:
            download_project(
                workspace,
                get_sys_db(),
                project_name,
                proj_path,
            )
            _set_deployment_id(workspace, project_name, new_deployment_id)
            changed = True

        if workspace not in _projects_by_workspace:
            _projects_by_workspace[workspace] = dict[str, Project]()

        if project_name not in _projects_by_workspace[workspace] or changed:
            project = run_main_function(
                proj_path,
                project_info["main_file_path"],
                project_info["main_func_name"],
            )
            _projects_by_workspace[workspace][project_name] = project
