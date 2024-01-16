from df_prep import system, Task


def action(params: Task):
    print("yep")
    print("done")


processor = system.create_processor("MyProc")
processor.add_param("par1")
processor.add_param("par2")

processor.set_action(action)
task = processor.create_task()
task.run()
