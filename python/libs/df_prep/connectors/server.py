from .database import Database


class Server:
    def __init__(self, connectionString: str):
        self.connectionString = connectionString

    def get_database(self, name: str) -> Database:
        return Database(self, name)
