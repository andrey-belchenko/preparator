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

    def instance(self) -> Collection:
        if self._instance == None:
            self._instance = self.database.instance()[self.name]
        return self._instance


class DbReader(DbCollection):
    def __init__(self, collectionName: str, database: Database = None):
        super().__init__(collectionName, database)

    def read_all(self):
        return self.instance().find({})

    def read_one(self):
        return self.instance().find_one({})


class MemoryReader:
    def __init__(self, data: list[dict[str, Any]]):
        self.data = data

    def read_all(self):
        return self.data

    def read_one(self) -> Any | None:
        if len(self.data) == 0:
            return None
        return self.data[0]


class DbWriter(DbCollection):
    def __init__(self, collectionName: str, database: Database = None):
        super().__init__(collectionName, database)

    def clear(self):
        self.instance().delete_many({})

    def write_many(self, documents: list[dict]):
        self.instance().insert_many(documents)
