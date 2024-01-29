from df_prep import management

mongo_uri="mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
mongo_database="bav_test2"

management.deploy_project(
    mongo_uri=mongo_uri,
    mongo_database=mongo_database,
    root_path=r"C:\Repos\mygithub\preparator\python\libs",
    include=["run/processors"],
    main_file_path=r"run/processors/main.py",
    main_func_name="create_project",
)


# management.remove_deployment(
#     mongo_uri,
#     mongo_database,
#     "matching",
# )

# management.download_project(
#     mongo_uri,
#     mongo_database,
#     "siber",
#     r"C:\Bin\df_prep\matching"
# )


