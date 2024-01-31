from pymongo import MongoClient
mongo_uri = f"mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
sys_db_name =  "bav_test_sys_python"
mongo = MongoClient(mongo_uri)

def get_sys_db():
    return mongo[sys_db_name]


def get_db(name:str):
    return mongo [name]
