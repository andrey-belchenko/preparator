from pymongo import MongoClient
from pymongo.database import Database as MongoDatabase
from pymongo.collection import Collection
from df_prep.config import config


client = MongoClient("localhost", 27017)


db = client["mydatabase"]
collection = db["mycollection"]

# Create a dictionary
my_dict = {"name": "John", "age": 30, "city": "New York"}

# Insert the dictionary into the collection
collection.insert_one(my_dict)


class DbConnection:
    def __init__(self, connectionString: str = None):
        self.connectionString = connectionString
        if self.connectionString == None:
            self.connectionString = config.db_connection_string
        self._instance = None

    def instance(self) -> MongoClient:
        if self._instance == None:
            self._instance = MongoClient(self.connectionString)
        return self._instance


class Database:
    def __init__(self, name: str = None, connection: DbConnection = None):
        self.name = name
        self.connection = connection
        if self.name == None:
            self.name = config.db_name
        if self.connection == None:
            self.connection = DbConnection()
        self._instance = None

    def instance(self) -> MongoDatabase:
        if self._instance == None:
            self._instance = self.connection.instance()[self.name]
        return self._instance


class DbCollection:
    def __init__(self, collectionName: str, database: Database = None):
        self.name = collectionName
        self.database = database
        if self.database == None:
            self.database = Database()
        self._instance = None

    def instance(self) -> Collection:
        if self._instance == None:
            self._instance = self.database.instance()[self.name]
        return self._instance


class DbReader(DbCollection):
    def __init__(self, collectionName: str, database: Database = None):
        super().__init__(collectionName, database)


class DbWriter(DbCollection):
    def __init__(self, collectionName: str, database: Database = None):
        super().__init__(collectionName, database)

    def insert_many(self, documents: list[dict]):
        self.instance().delete_many({})
        self.instance().insert_many(documents)
