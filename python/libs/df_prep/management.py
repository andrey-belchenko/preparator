import os
import shutil
from importlib.util import spec_from_file_location, module_from_spec
import sys
import git
from df_prep import Project
import pymongo
from pymongo.database import Database
from df_prep.mongo.commands import upsert_one_with_timestamp

from df_prep.mongo.files import delete_file, upload_file
from df_prep.processor import PortInfo


def publish_project(
    mongo_uri: str,
    mongo_database: str,
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    archive_path, project, temp_path = build_project(
        root_path, main_file_path, main_func_name, include
    )
    _upload_project(
        mongo_uri,
        mongo_database,
        archive_path,
        project,
        main_file_path,
        main_func_name,
        temp_path,
    )


def build_project(
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    temp_path = _copy_files_to_temp_dir(root_path, include)
    project = _run_main_function(temp_path, main_file_path, main_func_name)
    archive_path = _make_archive(temp_path, project.name)
    return archive_path, project, temp_path


def _dict_from_obj(obj):
    dict = {}
    for name in dir(obj):
        if not name.startswith("_"):
            val = getattr(obj, name)
            if isinstance(val, (str, bool)):
                dict[name] = val
    return dict


_coll_prefix = "sys_python_"


def _upload_project(
    mongo_uri,
    mongo_database,
    archive_path,
    project: Project,
    main_file_path,
    main_func_name,
    temp_path,
):
    version_info = _get_version_info()
    print(f"Upload project: start")
    client = pymongo.MongoClient(mongo_uri)
    db = client[mongo_database]
    collection = db[f"{_coll_prefix}project"]
    file_id = upload_file(archive_path, db)
    filter = {"name": project.name}
    for doc in collection.find(filter):
        old_file_id = doc["file_id"]
        delete_file(old_file_id, db)

    fields = _dict_from_obj(project)
    fields.update(
        {
            "file_id": file_id,
            "published_by": os.getlogin(),
            "version_info": version_info,
            "main_file_path": main_file_path,
            "main_func_name": main_func_name,
        }
    )
    upsert_one_with_timestamp(
        collection,
        filter,
        fields,
    )
    _update_modules_info(db, project, temp_path)
    _update_processors_info(db, project, temp_path)
    client.close()
    print(f"Upload project: success")
    print(f"- {fields}")


def _normalize_def_in_file(info: dict, root_path):
    info["defined_in_file"] = (
        os.path.relpath(info["defined_in_file"], start=root_path)
        .replace("\\", "/")
        .replace("../", "")
    )


def _update_modules_info(db: Database, project: Project, temp_path: str):
    collection = db[f"{_coll_prefix}module"]
    info_list = []
    for module in project.modules.values():
        info = _dict_from_obj(module)
        info.update(
            {
                "project": project.name,
            }
        )
        _normalize_def_in_file(info, temp_path)
        info_list.append(info)

    collection.delete_many({"project": project.name})
    collection.insert_many(info_list)


def _update_processors_info(db: Database, project: Project, temp_path: str):
    collection = db[f"{_coll_prefix}processor"]
    info_list = []
    for module in project.modules.values():
        for processor in module.processors.values():
            info = _dict_from_obj(processor)
            info.update(
                {
                    "project": project.name,
                    "module": module.name,
                }
            )
            _normalize_def_in_file(info, temp_path)

            def make_port_info(ports: dict[str, PortInfo]):
                ports_info = []
                for port in ports.values():
                    port_info = _dict_from_obj(port)
                    ports_info.append(port_info)
                    port_info["schema"] = port.schema
                return ports_info

            info["inputs"] = make_port_info(processor.inputs)
            info["outputs"] = make_port_info(processor.outputs)

            # info["temp_path"] = temp_path
            info_list.append(info)

    collection.delete_many({"project": project.name})
    collection.insert_many(info_list)


def _get_version_info():
    print("Get version info: start")
    try:
        repo = git.Repo(search_parent_directories=True)
        version_info = {
            "repository": repo.remotes.origin.url,
            "branch": repo.active_branch.name,
            "commit": repo.head.commit.hexsha,
            "is_dirty": bool(repo.is_dirty()),
        }
    except git.exc.InvalidGitRepositoryError:
        print("Get version info: git repository not found")  # todo не проверено
        return None
    if version_info != None:
        print("Get version info: success")
        print(version_info)
    return version_info


def _make_archive(temp_path, project_name):
    print("Make archive: start")
    archive_path = os.path.join(
        os.path.dirname(temp_path), "df_prep_projects", f"{project_name}"
    )
    archive_path_ext = archive_path + ".zip"
    if os.path.isfile(archive_path):
        os.remove(archive_path)
    shutil.make_archive(archive_path, "zip", temp_path)
    shutil.rmtree(temp_path)
    print("Make archive: success")
    print(f"- temp dir path: {archive_path_ext}")
    return archive_path_ext


def _copy_files_to_temp_dir(root_path, include: list[str] = None):
    print("Collect source files: start")
    temp_path = os.path.join(root_path, "build", "df_prep_temp")

    if os.path.isdir(temp_path):
        shutil.rmtree(temp_path)
    os.makedirs(temp_path)

    if include == None:
        include = os.listdir(root_path)

    for item in include:
        src_path = os.path.join(root_path, item)
        trg_path = os.path.join(temp_path, item)
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
    print(f"- temp dir path: {temp_path}")
    return temp_path


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
