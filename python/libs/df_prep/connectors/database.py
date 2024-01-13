from .server import Server


class Database:
    def __init__(self, server: Server, name: str):
        self.name = name
