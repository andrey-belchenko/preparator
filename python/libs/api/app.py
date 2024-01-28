from datetime import datetime
from fastapi import FastAPI, HTTPException, Path, Query, Body
from pydantic import BaseModel
from pymongo import MongoClient
from pyparsing import Any

from api.models import Project

app = FastAPI(port=8000)
mongo = MongoClient(f"mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017")

collection_prefix = "sys_python_"
project_coll_name = f"{collection_prefix}project"
module_coll_name = f"{collection_prefix}module"


@app.get("/projects")
async def get_projects(db_name: str = Query(...)) -> list[Project]:
    return mongo[db_name][project_coll_name].find({})


@app.get("/projects/{project_name}")
async def get_project(
    project_name: str = Path(...), db_name: str = Query(...)
) -> Project:
    item = mongo[db_name][project_coll_name].find_one({"name": project_name})
    if item is None:
        raise HTTPException(status_code=404)
    return item
