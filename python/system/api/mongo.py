from dataclasses import asdict
import os
from pymongo import MongoClient
from pymongo.collection import Collection
from api.models import TaskInfo, TaskRequest
from fastapi.encoders import jsonable_encoder
from dpt.deployment import common

# f"mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
mongo_uri = os.getenv("MONGO_URI")

sys_db_name = common.sys_db_name
mongo = MongoClient(mongo_uri)


def get_sys_db():
    return mongo[sys_db_name]


def get_db(name: str):
    return mongo[name]


collection_prefix = "sys_python_"
project_coll_name = f"{collection_prefix}project"
module_coll_name = f"{collection_prefix}module"
processor_coll_name = f"{collection_prefix}processor"
task_coll_name = f"{collection_prefix}task"
task_request_coll_name = f"{collection_prefix}task_request"


def get_project(workspace, name):
    return get_sys_db()[project_coll_name].find_one(
        {"workspace": workspace, "name": name}
    )


def get_module(workspace, name):
    return get_sys_db()[module_coll_name].find_one(
        {"workspace": workspace, "name": name}
    )


def get_task(id):
    return get_sys_db()[task_coll_name].find_one({"id": id})


def save_task(task: TaskInfo):
    _upsert_one_with_timestamp(
        get_sys_db()[task_coll_name], {"id": task.id}, jsonable_encoder(task)
    )


def get_task_request(task_id):
    return get_sys_db()[task_coll_name].find_one({"task_id": task_id})


def save_task_request(workspace: str, task_id: str, task_request: TaskRequest):
    obj = jsonable_encoder(task_request)
    obj["task_id"] = task_id
    obj["workspace"] = workspace
    _upsert_one_with_timestamp(get_sys_db()[task_coll_name], {"task_id": task_id}, obj)


def _upsert_one_with_timestamp(collection: Collection, filter, set: dict):
    update = {"$currentDate": {"changed_at": True}, "$set": set}
    result = collection.update_one(filter, update, upsert=True)
    return result
