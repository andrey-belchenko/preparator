from df_prep.deployment.extract import _download_project
from df_prep.deployment.publish import (
    _copy_files_to_temp_dir,
    _make_archive,
    _run_main_function,
    _upload_project,
)
from pymongo.database import Database


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


def download_project(db: Database, project_name: str, folder_path: str):
    _download_project(db, project_name, folder_path)
