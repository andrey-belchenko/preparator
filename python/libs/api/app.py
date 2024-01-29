import uuid
from fastapi import FastAPI, HTTPException, Path, Query, Body
from pymongo import MongoClient
from pyparsing import Any

from api.models import (
    ProjectInfo,
    ModuleInfo,
    ProcessorInfo,
    TaskRequest,
    TaskInfo,
)

app = FastAPI(port=8000)
mongo = MongoClient(f"mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017")

collection_prefix = "sys_python_"
project_coll_name = f"{collection_prefix}project"
module_coll_name = f"{collection_prefix}module"
processor_coll_name = f"{collection_prefix}processor"


@app.get("/projects")
async def get_projects(db_name: str = Query(...)) -> list[ProjectInfo]:
    return mongo[db_name][project_coll_name].find({})


@app.get("/projects/{name}")
async def get_project(name: str = Path(...), db_name: str = Query(...)) -> ProjectInfo:
    item = mongo[db_name][project_coll_name].find_one({"name": name})
    if item is None:
        raise HTTPException(status_code=404)
    return item


@app.get("/modules")
async def get_modules(db_name: str = Query(...)) -> list[ModuleInfo]:
    return mongo[db_name][module_coll_name].find({})


@app.get("/modules/{name}")
async def get_module(name: str = Path(...), db_name: str = Query(...)) -> ModuleInfo:
    item = mongo[db_name][module_coll_name].find_one({"name": name})
    if item is None:
        raise HTTPException(status_code=404)
    return item


@app.get("/processors")
async def get_processors(db_name: str = Query(...)) -> list[ProcessorInfo]:
    return mongo[db_name][processor_coll_name].find({})


@app.get("/modules/{module_name}/processors/{processor_name}")
async def get_processor(
    module_name: str = Path(...),
    processor_name: str = Path(...),
    db_name: str = Query(...),
) -> ProcessorInfo:
    item = mongo[db_name][processor_coll_name].find_one(
        {"module": module_name, "name": processor_name}
    )
    if item is None:
        raise HTTPException(status_code=404)
    return item


tasks = {}


@app.post("/modules/{module_name}/processors/{processor_name}/tasks")
async def run_task(
    task_request: TaskRequest,
    module_name: str = Path(...),
    processor_name: str = Path(...),
    db_name: str = Query(...),
) -> TaskInfo:
    task = TaskInfo(
        module=module_name,
        processor=processor_name,
        status=TaskInfo.TaskStatus.RUNNING,
        task_request=task_request,
        id=str(uuid.uuid4()),
    )
    tasks[task.id] = task
    return task


@app.get("/tasks/{id}")
async def run_task(
    id: str = Path(...),
    db_name: str = Query(...),
) -> TaskInfo:
    return tasks[id]
