from main import create_module


module = create_module()
module.db_con_str = "mongodb://root:eximer@mongodb.mrsk.oastu.lan:27017"
module.db_name = "test"

processor = module.get_processor("ya_disk_excel_input")
task = processor.create_task()

task.set_input_data(
    "params",
    {
        "file_path": "МРСК\Разное\Пример данных для загрузки\Пример1.xlsx",
        "api_token": "y0_AgAEA7qjwkyUAADLWwAAAAD4F9e5CBIdi4wZTfa5hXBxUhCHwbcg6T8",
    },
)
task.set_output_collection("output", "incoming_data1")
task.run()

processor = module.get_processor("string_normalizer")
task = processor.create_task()
task.set_input_collection("input", "incoming_data1")
task.set_output_collection("output", "processed_data")
task.run()


