from pymongo import MongoClient
from pymongo.database import Database as MongoDatabase
from pymongo.collection import Collection
from typing import Any


class DbConnection:
    def __init__(self, connectionString):
        self.connectionString = connectionString
        # if self.connectionString == None:
        #     from .system import system
        #     self.connectionString = system.db_connection_string
        self._instance = None

    def instance(self) -> MongoClient:
        if self._instance == None:
            self._instance = MongoClient(self.connectionString)
        return self._instance


class Database:
    def __init__(self, name: str, connection: DbConnection):
        self.name = name
        self.connection = connection
        # if self.name == None:
        #     from .system import system
        #     self.name = system.db_name
        # if self.connection == None:
        #     self.connection = DbConnection()
        self._instance = None

    def instance(self) -> MongoDatabase:
        if self._instance == None:
            self._instance = self.connection.instance()[self.name]
        return self._instance


class DbCollection:
    def __init__(self, collectionName: str, database: Database):
        self.name = collectionName
        self.database = database
        # if self.database == None:
        #     self.database = Database()
        self._instance = None

    def get_info(self):
        return f"collection '{self.name}'"

    def instance(self) -> Collection:
        if self._instance == None:
            self._instance = self.database.instance()[self.name]
        return self._instance


class DbReader(DbCollection):
    def __init__(self, collectionName: str, database: Database = None):
        super().__init__(collectionName, database)

    def read_all(self):
        print(
            f"read {self.instance().count_documents({})} documents from {self.get_info()}"
        )
        return self.instance().find({})

    def read_one(self):
        return self.instance().find_one({})


class MemoryReader:
    def __init__(self, data: list[dict[str, Any]]):
        self._data = data

    def get_info(self):
        return f"list[]"
    
    def read_all(self):
        print(f"read {self._data.count()} documents from {self.get_info()}")
        return self._data

    def read_one(self) -> Any | None:
        if len(self._data) == 0:
            return None
        return self._data[0]


class DbWriter(DbCollection):
    def __init__(self, collectionName: str, database: Database = None):
        super().__init__(collectionName, database)
        self._count = 0
        self._closed = True

    def clear(self):
        self.instance().delete_many({})

    def write_many(self, documents: list[dict]):
        self.instance().insert_many(documents)
        self._count += len(documents)
        self._closed = False

    def close(self):
        self._closed = True
        print(f"loaded {self._count} documents into {self.get_info()}")

    def is_closed(self):
        return self._closed


class MemoryWriter:
    def __init__(self, data: list[dict[str, Any]]):
        self._data = data
        self._count = 0
        self._closed = True

    def get_info(self):
        return f"list[]"

    def clear(self):
        self._data.clear()

    def write_many(self, documents: list[dict]):
        self._data.extend(documents)
        self._count += len(documents)
        self._closed = False

    def close(self):
        print(f"loaded {self._count} documents into {self.get_info()}")
        self._closed = True

    def is_closed(self):
        return self._closed
