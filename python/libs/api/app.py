from datetime import datetime
from fastapi import FastAPI, Path, Query, Body
from pydantic import BaseModel
from pymongo import MongoClient
from pyparsing import Any

app = FastAPI(port=8000)
mongo = MongoClient(f"mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017")


class VersionInfo(BaseModel):
    repository: str
    branch: str
    commit: str
    is_dirty: bool


class Project(BaseModel):
    name: str
    changed_at: datetime
    deployment_id: str
    main_file_path: str
    main_func_name: str
    published_by: str
    version_info: VersionInfo
    deployment_id: str


_collection_prefix = "sys_python_"


def _remove_object_id(items):
    result = list(items)
    for item in result:
        del item["_id"]
        del item["file_id"]
    return result


@app.get("/projects")
async def get_projects(db_name: str = Query(...)):
    db = mongo[db_name]
    collection = db[f"{_collection_prefix}project"]
    items = _remove_object_id(collection.find({}))
    items = [Project.model_validate(it) for it in items]
    return items


# user_id: int = Path(...),


# @app.post("/users")
# async def create_user(user: User):
#     # Create user using data from User model
#     # return confirmation or created user data
#     pass
