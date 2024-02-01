from pymongo.collection import Collection


def upsert_one_with_timestamp(collection: Collection, filter, set):
    update = {"$currentDate": {"changed_at": True}, "$set": set}
    result = collection.update_one(filter, update, upsert=True)
    return result
