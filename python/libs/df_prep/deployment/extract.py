import io
import os
import shutil
import zipfile
from pymongo.database import Database
from df_prep.deployment.common import _coll_prefix
from df_prep.mongo.files import read_file_data



def download_project(db: Database, project_name: str, folder_path: str):
    print(f"Download project: start")
    print(f"- project_name: {project_name}")
    collection = db[f"{_coll_prefix}project"]
    info = collection.find_one({"name": project_name})
    if info == None:
        raise Exception(f"Project '{project_name}' is not found in database {db.name}")
    data = io.BytesIO(read_file_data(info["file_id"], db))
    if os.path.isdir(folder_path):
        shutil.rmtree(folder_path)
    os.makedirs(folder_path, exist_ok=True)
    with zipfile.ZipFile(data, 'r') as zip_ref:
        zip_ref.extractall(folder_path)
    print(f"Download project: success")
    print(f"- folder_path: {folder_path}")


