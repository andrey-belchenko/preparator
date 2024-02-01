import logging
from df_prep import management



management.set_connection("mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017")
management.set_workspace("bav_test4")

management.deploy_project(
    root_path=r"C:\Repos\mygithub\preparator\python\libs",
    include=["run/processors"],
    main_file_path=r"run/processors/main.py",
    main_func_name="create_project",
)



# management.remove_deployment(
#     "matching",
# )

# management.download_project(
#     "siber",
#     r"C:\Bin\df_prep\matching"
# )


