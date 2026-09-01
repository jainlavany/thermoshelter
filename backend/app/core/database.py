from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_helper = Database()

def get_database():
    if db_helper.db is None:
        db_helper.client = AsyncIOMotorClient(settings.MONGO_URI)
        db_helper.db = db_helper.client.get_default_database()
    return db_helper.db

def get_sync_database():
    client = MongoClient(settings.MONGO_URI)
    return client.get_database()
