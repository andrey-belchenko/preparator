from .database import Database


class InputDataSet:
    def __init__(self, database: Database, collectionName: str):
        self.name = collectionName

    def greet(self):
        msg = "Hello, my name is " + self.name
        print(msg)
        return msg
