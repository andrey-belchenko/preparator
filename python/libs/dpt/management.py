import logging
import pymongo
from dpt.deployment import extract
from dpt.deployment import common
from dpt.deployment.deploy import (
    _copy_files_to_temp_dir,
    _make_archive,
    _remove_deployment,
    run_main_function,
    _upload_project,
)
from pymongo.database import Database




_logging_config_done = False


def _configure_logging():
    global _logging_config_done
    if _logging_config_done:
        return
    _logging_config_done = True
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    console_handler = logging.StreamHandler()
    logger.addHandler(console_handler)


def set_connection(mongo_uri: str):
    common._mongo_uri = mongo_uri


def set_workspace(workspace_name: str):
    common._workspace_name = workspace_name


def deploy_project(
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    _configure_logging()
    archive_path, project, temp_path = build_project(
        root_path, main_file_path, main_func_name, include
    )
    _upload_project(
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
    _configure_logging()
    temp_path = _copy_files_to_temp_dir(root_path, include)
    project = run_main_function(temp_path, main_file_path, main_func_name)
    archive_path = _make_archive(temp_path, project.name)
    return archive_path, project, temp_path


def download_project(project_name: str, folder_path: str):
    db = pymongo.MongoClient(common._mongo_uri)[common._sys_db_name]
    extract.download_project(common._workspace_name, db, project_name, folder_path)


def remove_deployment(mongo_uri, project_name, sys_db_name=common._sys_db_name):
    _remove_deployment(mongo_uri, sys_db_name, project_name)
