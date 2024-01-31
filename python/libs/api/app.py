import logging
import uuid
from fastapi import FastAPI, HTTPException, Path, Query, Body
from pyparsing import Any
from api.mongo import get_sys_db
from api import mongo
from api import processing
from api.models import (
    ProjectInfo,
    ModuleInfo,
    ProcessorInfo,
    TaskRequest,
    TaskInfo,
)

app = FastAPI(port=8000)
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
console_handler = logging.StreamHandler()
root_logger.addHandler(console_handler)

collection_prefix = "sys_python_"
project_coll_name = f"{collection_prefix}project"
module_coll_name = f"{collection_prefix}module"
processor_coll_name = f"{collection_prefix}processor"


@app.get("/projects")
async def get_projects(workspace: str = Query(...)) -> list[ProjectInfo]:
    return get_sys_db()[project_coll_name].find({"workspace": workspace})


@app.get("/projects/{name}")
async def get_project(
    name: str = Path(...), workspace: str = Query(...)
) -> ProjectInfo:
    item = mongo.get_project(workspace, name)
    if item is None:
        raise HTTPException(status_code=404)
    return item


@app.get("/modules")
async def get_modules(workspace: str = Query(...)) -> list[ModuleInfo]:
    return get_sys_db()[module_coll_name].find({"workspace": workspace})


@app.get("/modules/{name}")
async def get_module(name: str = Path(...), workspace: str = Query(...)) -> ModuleInfo:
    item = mongo.get_module(workspace, name)
    if item is None:
        raise HTTPException(status_code=404)
    return item


@app.get("/processors")
async def get_processors(workspace: str = Query(...)) -> list[ProcessorInfo]:
    return get_sys_db()[processor_coll_name].find({"workspace": workspace})


@app.get("/modules/{module_name}/processors/{processor_name}")
async def get_processor(
    module_name: str = Path(...),
    processor_name: str = Path(...),
    workspace: str = Query(...),
) -> ProcessorInfo:
    item = get_sys_db()[processor_coll_name].find_one(
        {"workspace": workspace, "module": module_name, "name": processor_name}
    )
    if item is None:
        raise HTTPException(status_code=404)
    return item


task_infos = dict[str,TaskInfo]()
task_requests = {}


@app.post("/modules/{module_name}/processors/{processor_name}/tasks")
async def run_task(
    task_request: TaskRequest,
    module_name: str = Path(...),
    processor_name: str = Path(...),
    workspace: str = Query(...),
) -> TaskInfo:
    module_info = mongo.get_module(workspace, module_name)
    if module_info is None:
        raise HTTPException(
            status_code=404,
            detail=f"module '{module_name}' is not found in workspace '{workspace}'",
        )
    await processing.run_task(
        workspace,
        module_info["project"],
        module_name,
        processor_name,
        task_request.input_bindings,
        task_request.output_bindings,
        task_request.is_async,
    )
    task_info = TaskInfo(
        module=module_name,
        processor=processor_name,
        status=TaskInfo.TaskStatus.RUNNING,
        id=str(uuid.uuid4()),
    )
    task_infos[task_info.id] = task_info
    task_requests[task_info.id] = task_request
    return task_info


@app.get("/tasks/{id}")
async def get_task_request(
    id: str = Path(...),
    workspace: str = Query(...),
) -> TaskInfo:
    if not id in task_infos:
        raise HTTPException(status_code=404)
    return task_infos[id]


@app.get("/tasks/{id}/request")
async def get_task_request(
    id: str = Path(...),
    workspace: str = Query(...),
) -> TaskRequest:
    if not id in task_infos:
        raise HTTPException(status_code=404)
    return task_requests[id]
