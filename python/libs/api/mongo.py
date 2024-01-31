from pymongo import MongoClient

mongo_uri = f"mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
sys_db_name = "bav_test_sys_python"
mongo = MongoClient(mongo_uri)


def get_sys_db():
    return mongo[sys_db_name]


def get_db(name: str):
    return mongo[name]



collection_prefix = "sys_python_"
project_coll_name = f"{collection_prefix}project"
module_coll_name = f"{collection_prefix}module"
processor_coll_name = f"{collection_prefix}processor"


def get_project(workspace, name):
    return get_sys_db()[project_coll_name].find_one(
        {"workspace": workspace, "name": name}
    )


def get_module(workspace, name):
    return get_sys_db()[module_coll_name].find_one(
        {"workspace": workspace, "name": name}
    )
