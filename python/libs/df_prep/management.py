import os
import shutil
from importlib.util import spec_from_file_location, module_from_spec
import sys
import git
from df_prep import Project
import pymongo
import gridfs

from df_prep.mongo.files import delete_file, upload_file


def publish_project(
    mongo_uri: str,
    mongo_database: str,
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    archive_path, project_name, version_info = build_project(
        root_path, main_file_path, main_func_name, include
    )
    _upload_project(mongo_uri, mongo_database, archive_path, project_name, version_info)


def build_project(
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    tmp_path = _copy_files_to_temp_dir(root_path, include)
    version_info = _add_version_info(tmp_path)
    project = _run_main_function(tmp_path, main_file_path, main_func_name)
    archive_path = _make_archive(tmp_path, project.name)
    return archive_path, project.name, version_info


def get_project_version_info(path):
    return _run_function(path, "version_info.py")


def _upload_project(
    mongo_uri, mongo_database, archive_path, project_name, version_info
):
    print(f"Upload project: start")
    client = pymongo.MongoClient(mongo_uri)
    db = client[mongo_database]
    coll_name = "sys_python_project"
    collection = db[coll_name]
    fileID = upload_file(archive_path, db)
    filter = {"project_name": project_name}
    for doc in collection.find({"projectName": project_name}):
        oldFileId = doc["fileId"]
        delete_file(oldFileId, db)
    collection.delete_many(filter)
    update = {
        "$currentDate": {"changed_at": True},
        "$set": {
            "project_name": project_name,
            "file_id": fileID,
            "changed_by": os.getlogin(),
            "version_info": version_info,
        },
    }
    collection.update_one(filter, update, upsert=True)
    print(f"Upload project: success")


def _add_version_info(tmp_path):
    print("Add version info: start")
    try:
        repo = git.Repo(search_parent_directories=True)
        version_info = {
            "repository": repo.remotes.origin.url,
            "branch": repo.active_branch.name,
            "commit": repo.head.commit.hexsha,
            "is_dirty": bool(repo.is_dirty()),
        }
    except git.exc.InvalidGitRepositoryError:
        print("Add version info: git repository not found")  # todo не проверено
        return None

    py_pile_path = os.path.join(tmp_path, "version_info.py")

    with open(py_pile_path, "w", encoding="utf-8") as f:
        f.write(
            f"""
def main():
    return {version_info}
"""
        )
    if version_info != None:
        version_info = get_project_version_info(tmp_path)  # проверка
        print("Add version info: success")
        print(version_info)
    return version_info


def _make_archive(tmp_path, project_name):
    print("Make archive: start")
    archive_path = os.path.join(
        os.path.dirname(tmp_path), "df_prep_projects", f"{project_name}"
    )
    archive_path_ext = archive_path + ".zip"
    if os.path.isfile(archive_path):
        os.remove(archive_path)
    shutil.make_archive(archive_path, "zip", tmp_path)
    shutil.rmtree(tmp_path)
    print("Make archive: success")
    print(f"- temp dir path: {archive_path_ext}")
    return archive_path_ext


def _copy_files_to_temp_dir(root_path, include: list[str] = None):
    print("Collect source files: start")
    tmp_path = os.path.join(root_path, "build", "df_prep_temp")

    if os.path.isdir(tmp_path):
        shutil.rmtree(tmp_path)
    os.makedirs(tmp_path)

    if include == None:
        include = os.listdir(root_path)

    for item in include:
        src_path = os.path.join(root_path, item)
        trg_path = os.path.join(tmp_path, item)
        if os.path.isdir(src_path):
            shutil.copytree(
                src_path,
                trg_path,
                ignore=shutil.ignore_patterns("__pycache__", "build"),
            )
        else:
            os.makedirs(os.path.dirname(trg_path))
            shutil.copy(src_path, trg_path)
    print("Collect source files: success")
    print(f"- temp dir path: {tmp_path}")
    return tmp_path


def _run_function(root_path, file_path, func_name="main"):
    if root_path not in sys.path:
        sys.path.append(root_path)
    file_full_path = os.path.join(root_path, file_path)
    spec = spec_from_file_location("module", file_full_path)
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    func = getattr(module, func_name)
    return func()


def _run_main_function(tmp_path, main_file_path, main_func_name):
    print("Build project: start")
    project: Project = _run_function(tmp_path, main_file_path, main_func_name)
    if not isinstance(project, Project):
        raise Exception(
            f"Main function '{main_func_name}' should return instance of 'df_prep.Project' class"
        )
    print("Build project: success")
    print(f"- project: {project.name}")
    for module_name in project.modules:
        module = project.modules[module_name]
        print(f"- - module: {module.name}")
        for proc_name in module.processors:
            print(f"- - - processor: {proc_name}")
    return project
