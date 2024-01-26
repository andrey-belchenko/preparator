import os
import shutil


def publish_project(
    project_name: str, root_path: str, main_file_path: str, main_func_name: str
):
    tmp_path = _copy_files_to_temp_dir(project_name, root_path)
    print(tmp_path)


def _copy_files_to_temp_dir(project_name, root_path):
    tmp_main_path = os.path.join(root_path, "build", "df_prep")
    tmp_path = os.path.join(tmp_main_path, project_name)
    if not os.path.exists(tmp_main_path):
        os.makedirs(tmp_main_path)
    if os.path.isdir(tmp_path):
        shutil.rmtree(tmp_path)
    #  ignore=shutil.ignore_patterns("__pycache__")
    shutil.copytree(
        root_path, tmp_path, ignore=shutil.ignore_patterns("__pycache__", "build")
    )
    return tmp_path
