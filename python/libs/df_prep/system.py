from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from processor import Processor


class System:
    def __init__(self):
        from .processor import Processor

        self.processors = dict[str, Processor]()
        self.db_connection_string = ""
        self.db_name = ""

    def create_processor(self, name: str, title=None, description=None):
        from .processor import Processor

        if name in self.processors:
            raise Exception(f"duplicated processor name {name}")
        processor = Processor(name, title, description)
        self.processors[name] = processor
        return processor

    def get_processor(self, name: str):
        from .processor import Processor

        return self.processors[name]


system = System()
