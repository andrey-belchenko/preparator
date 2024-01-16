from typing import TYPE_CHECKING


if TYPE_CHECKING:
    from processor import Processor


class System:
    def __init__(self):
        self.processors = dict[str, Processor]()

    def create_processor(self, name: str, title=None, description=None) -> Processor:
        if name in self.processors:
            raise Exception(f"duplicated processor name {name}")
        processor = Processor(name, title, description)
        self.processors[name] = processor
