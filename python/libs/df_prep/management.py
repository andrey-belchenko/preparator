import os
import shutil
from importlib.util import spec_from_file_location, module_from_spec
import sys


def publish_project(
    project_name: str,
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    # current_working_directory = os.getcwd()
    # print(current_working_directory)

    # print(sys.path)
    tmp_path = _copy_files_to_temp_dir(project_name, root_path, include)
    print(tmp_path)
    _run_in_temp_dir(tmp_path, main_file_path, main_func_name)


def _copy_files_to_temp_dir(project_name, root_path, include: list[str] = None):
    tmp_main_path = os.path.join(root_path, "build", "df_prep")
    tmp_path = os.path.join(tmp_main_path, project_name)
    if not os.path.exists(tmp_main_path):
        os.makedirs(tmp_main_path)
    if os.path.isdir(tmp_path):
        shutil.rmtree(tmp_path)
    # shutil.copytree(
    #     root_path, tmp_path, ignore=shutil.ignore_patterns("__pycache__", "build")
    # )

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

    return tmp_path


def _run_in_temp_dir(tmp_path, main_file_path, main_func_name):
    sys.path.append(tmp_path)
    main_file_path_full_path = os.path.join(tmp_path, main_file_path)
    spec = spec_from_file_location("module", main_file_path_full_path)
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    main_func = getattr(module, main_func_name)
    result = main_func()
    print(result)
