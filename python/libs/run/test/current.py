from df_prep import management

# management.publish_project(
#     root_path=r"C:\Repos\mygithub\preparator\python\libs",
#     include=["run/processors"],
#     main_file_path=r"run/processors/main.py",
#     main_func_name="create_project",
# )


import git

repo = git.Repo(search_parent_directories=True)

repo_name = repo.remotes.origin.url  # Or repo.working_tree_dir for local path
current_branch = repo.active_branch.name
last_commit_id = repo.head.commit.hexsha

uncommitted_changes = bool(repo.is_dirty())  # True if there are uncommitted changes

print("Repo name:", repo_name)
print("Current branch:", current_branch)
print("Last commit ID:", last_commit_id)
print("Uncommitted changes:", uncommitted_changes)