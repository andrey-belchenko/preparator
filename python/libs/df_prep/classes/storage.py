# class Database:
#     pass

# class InputDataSet:
#     pass

# class OutputDataSet:
#     pass


class DbConnection:
    def __init__(self, connectionString: str):
        self.connectionString = connectionString


class Database:
    def __init__(self, name: str, connection: DbConnection = None):
        self.name = name


class DbReader:
    def __init__(self, collectionName: str, database: Database = None):
        self.name = collectionName


class DbWriter:
    def __init__(self, collectionName: str, database: Database = None):
        self.name = collectionName
