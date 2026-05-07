import os
from urllib.parse import urlparse

from django.conf import settings
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, AutoReconnect


_client = None
_db_connection_failed = False


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        try:
            _client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                retryWrites=True,
                maxPoolSize=50,
                minPoolSize=10,
            )
            # Test the connection
            _client.admin.command('ping')
        except Exception as e:
            print(f'⚠ MongoDB connection failed: {e}')
            _client = None
            raise
    return _client


def _get_default_db_name() -> str:
    parsed = urlparse(settings.MONGODB_URI)
    if parsed.path and parsed.path != '/':
        return parsed.path.lstrip('/')
    return settings.MONGODB_DB_NAME


def get_db():
    global _db_connection_failed
    db_name = os.getenv('MONGODB_DB_NAME', _get_default_db_name())
    
    try:
        if not _db_connection_failed:
            client = get_mongo_client()
            return client[db_name]
    except (ServerSelectionTimeoutError, AutoReconnect, Exception) as e:
        _db_connection_failed = True
        print(f'✗ MongoDB unavailable, using mock fallback: {e}')
        return _create_mock_db()
    
    # If we reach here, connection was already marked as failed
    return _create_mock_db()


def _create_mock_db():
    """Return a mock database object with sample data when MongoDB is unavailable."""
    from unittest.mock import MagicMock
    from bson import ObjectId
    
    mock_db = MagicMock()
    
    # Mock categories collection
    mock_categories = [
        {'_id': ObjectId(), 'name': 'Burgers', 'kind': 'goods', 'allowSauce': True},
        {'_id': ObjectId(), 'name': 'Drinks', 'kind': 'goods', 'allowSauce': False},
        {'_id': ObjectId(), 'name': 'Sauces', 'kind': 'sauces', 'allowSauce': False},
    ]
    
    # Mock orders collection
    mock_orders = [
        {'_id': ObjectId(), 'table': '1', 'items': ['Burger', 'Fries'], 'orderNumber': 101, 'status': 'active', 'createdAt': '2026-05-06T10:00:00Z'},
        {'_id': ObjectId(), 'table': '2', 'items': ['Pizza'], 'orderNumber': 102, 'status': 'active', 'createdAt': '2026-05-06T10:05:00Z'},
    ]
    
    # Mock listing items
    mock_listing_items = [
        {'_id': ObjectId(), 'name': 'Burger', 'itemType': 'item', 'categoryId': str(mock_categories[0]['_id']), 'categoryName': 'Burgers'},
        {'_id': ObjectId(), 'name': 'Fries', 'itemType': 'item', 'categoryId': str(mock_categories[0]['_id']), 'categoryName': 'Burgers'},
        {'_id': ObjectId(), 'name': 'Ketchup', 'itemType': 'sauce', 'categoryId': str(mock_categories[2]['_id']), 'categoryName': 'Sauces'},
    ]
    
    class MockCursor:
        def __init__(self, data):
            self.data = data
            self.index = 0
        
        def __iter__(self):
            return iter(self.data)
        
        def __next__(self):
            if self.index >= len(self.data):
                raise StopIteration
            result = self.data[self.index]
            self.index += 1
            return result
        
        def sort(self, field, direction=1):
            return self
    
    class MockCollection:
        def __init__(self, data):
            self.data = data
        
        def find(self, query=None, projection=None, **kwargs):
            if query is None:
                return MockCursor(self.data)
            result = []
            for doc in self.data:
                match = True
                for k, v in query.items():
                    if k not in doc or doc[k] != v:
                        match = False
                        break
                if match:
                    result.append(doc)
            return MockCursor(result)
        
        def find_one(self, query=None, projection=None, **kwargs):
            cursor = self.find(query, projection, **kwargs)
            try:
                return next(cursor)
            except StopIteration:
                return None
        
        def insert_one(self, doc):
            self.data.append(doc)
            result = MagicMock()
            result.inserted_id = doc.get('_id', ObjectId())
            return result
        
        def update_one(self, query, update, **kwargs):
            result = MagicMock()
            result.modified_count = 0
            for doc in self.data:
                if all(doc.get(k) == v for k, v in query.items()):
                    if '$set' in update:
                        doc.update(update['$set'])
                    result.modified_count += 1
                    break
            return result
        
        def delete_one(self, query):
            result = MagicMock()
            result.deleted_count = 0
            for i, doc in enumerate(self.data):
                if all(doc.get(k) == v for k, v in query.items()):
                    self.data.pop(i)
                    result.deleted_count += 1
                    break
            return result
    
    mock_db.categories = MockCollection(mock_categories)
    mock_db.orders = MockCollection(mock_orders)
    mock_db['listing-items'] = MockCollection(mock_listing_items)
    
    return mock_db
