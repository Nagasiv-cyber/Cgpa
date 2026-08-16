import os
from typing import Optional, Dict, Any, List
# pyrefly: ignore [missing-import]
from bson import ObjectId
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "aiml_result_db")

class InsertResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class DeleteResult:
    def __init__(self, deleted_count):
        self.deleted_count = deleted_count

class UpdateResult:
    def __init__(self, modified_count, upserted_id=None):
        self.modified_count = modified_count
        self.upserted_id = upserted_id

class MockCursor:
    def __init__(self, items: List[Dict[str, Any]]):
        self.items = list(items)
        self._index = 0

    def sort(self, key: str, direction: int = 1):
        reverse = (direction == -1)
        self.items.sort(key=lambda x: x.get(key, 0), reverse=reverse)
        return self

    def limit(self, count: int):
        self.items = self.items[:count]
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index < len(self.items):
            item = self.items[self._index]
            self._index += 1
            return item
        else:
            raise StopAsyncIteration

class MockCollection:
    def __init__(self, name: str):
        self.name = name
        self.docs: List[Dict[str, Any]] = []

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "_id":
                if str(doc.get("_id")) != str(v) and doc.get("_id") != v:
                    return False
            elif doc.get(k) != v:
                return False
        return True

    async def find_one(self, query: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        query = query or {}
        for doc in self.docs:
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Dict[str, Any] = None) -> MockCursor:
        query = query or {}
        matched = [dict(d) for d in self.docs if self._matches(d, query)]
        return MockCursor(matched)

    async def insert_one(self, doc: Dict[str, Any]) -> InsertResult:
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = ObjectId()
        self.docs.append(new_doc)
        return InsertResult(new_doc["_id"])

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> UpdateResult:
        existing = await self.find_one(query)
        set_fields = update.get("$set", {})
        if existing:
            for doc in self.docs:
                if self._matches(doc, query):
                    doc.update(set_fields)
                    return UpdateResult(1)
        elif upsert:
            new_doc = dict(query)
            new_doc.update(set_fields)
            if "_id" not in new_doc:
                new_doc["_id"] = ObjectId()
            self.docs.append(new_doc)
            return UpdateResult(1, upserted_id=new_doc["_id"])
        return UpdateResult(0)

    async def delete_one(self, query: Dict[str, Any]) -> DeleteResult:
        for i, doc in enumerate(self.docs):
            if self._matches(doc, query):
                self.docs.pop(i)
                return DeleteResult(1)
        return DeleteResult(0)

    async def delete_many(self, query: Dict[str, Any]) -> DeleteResult:
        initial = len(self.docs)
        self.docs = [d for d in self.docs if not self._matches(d, query)]
        return DeleteResult(initial - len(self.docs))

class MockDatabase:
    def __init__(self):
        self.collections: Dict[str, MockCollection] = {}

    def __getattr__(self, name: str) -> MockCollection:
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]

    def __getitem__(self, name: str) -> MockCollection:
        return self.__getattr__(name)

class DatabaseContainer:
    client: Optional[AsyncIOMotorClient] = None

db_container = DatabaseContainer()
_mock_db = MockDatabase()
_use_mock = False

async def connect_to_mongo():
    global _use_mock
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=1000)
        await client.admin.command('ping')
        db_container.client = client
        _use_mock = False
        print(f"[MongoDB] Connected asynchronously to database: {DB_NAME}")
    except Exception as e:
        _use_mock = True
        print(f"[MongoDB] Server unavailable ({e}). Fallback to in-memory database engine.")

async def close_mongo_connection():
    if db_container.client:
        db_container.client.close()
        print("[MongoDB] Connection closed.")

def get_database():
    if _use_mock or db_container.client is None:
        return _mock_db
    return db_container.client[DB_NAME]
