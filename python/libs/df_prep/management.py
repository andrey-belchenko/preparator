import os
import shutil
from importlib.util import spec_from_file_location, module_from_spec
import sys
import git
from df_prep import Project


def publish_project(
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    archive_path = build_project(root_path, main_file_path, main_func_name, include)


def build_project(
    root_path: str,
    main_file_path: str,
    main_func_name: str,
    include: list[str] = None,
):
    tmp_path = _copy_files_to_temp_dir(root_path, include)
    _add_git_info(tmp_path)
    project = _run_main_function(tmp_path, main_file_path, main_func_name)
    archive_path = _make_archive(tmp_path, project.name)
    return archive_path


def get_project_git_info(path):
    return _run_function(path, "git_info.py")


def _add_git_info(tmp_path):
    print("Add git info: start")
    try:
        repo = git.Repo(search_parent_directories=True)
        git_info = {
            "repository": repo.remotes.origin.url,
            "branch": repo.active_branch.name,
            "commit": repo.head.commit.hexsha,
            "is_dirty": bool(repo.is_dirty()),
        }
    except git.exc.InvalidGitRepositoryError:
        print("Add git info: git repository not found")  # todo не проверено
        return None

    py_pile_path = os.path.join(tmp_path, "git_info.py")

    with open(py_pile_path, "w", encoding="utf-8") as f:
        f.write(
            f"""
def main():
    return {git_info}
"""
        )
    if git_info != None:
        git_info = get_project_git_info(tmp_path) # проверка 
        print("Add git info: success")
        print(git_info)


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
