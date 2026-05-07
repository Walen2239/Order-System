from datetime import datetime, timezone

from bson import ObjectId
from rest_framework import status, viewsets
from rest_framework.response import Response

from .mongo import get_db
from .serializers import CategorySerializer, ListingItemSerializer, OrderSerializer


class PingView(viewsets.ViewSet):
    def list(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class CategoryViewSet(viewsets.ViewSet):
    serializer_class = CategorySerializer

    def list(self, request):
        docs = list(get_db().categories.find({}, {'name': 1, 'kind': 1, 'allowSauce': 1}).sort('name', 1))
        payload = [
            {
                'id': str(doc['_id']),
                'name': doc.get('name', ''),
                'kind': doc.get('kind', 'goods'),
                'allowSauce': doc.get('allowSauce', False),
            }
            for doc in docs
        ]
        return Response(payload, status=status.HTTP_200_OK)

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        name = serializer.validated_data['name'].strip()
        kind = serializer.validated_data['kind']
        allow_sauce = serializer.validated_data.get('allowSauce', False)
        if not name:
            return Response({'name': ['This field may not be blank.']}, status=status.HTTP_400_BAD_REQUEST)

        existing = get_db().categories.find_one(
            {
                'name': {'$regex': f'^{name}$', '$options': 'i'},
                'kind': kind,
            }
        )
        if existing:
            return Response(
                {
                    'id': str(existing['_id']),
                    'name': existing.get('name', ''),
                    'kind': existing.get('kind', 'goods'),
                    'allowSauce': existing.get('allowSauce', False),
                },
                status=status.HTTP_200_OK,
            )

        doc = {
            'name': name,
            'kind': kind,
            'allowSauce': bool(allow_sauce),
        }
        result = get_db().categories.insert_one(doc)
        return Response(
            {
                'id': str(result.inserted_id),
                'name': name,
                'kind': kind,
                'allowSauce': bool(allow_sauce),
            },
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, pk=None):
        try:
            oid = ObjectId(pk)
        except Exception:
            return Response({'detail': 'Invalid category id.'}, status=status.HTTP_400_BAD_REQUEST)

        # remove listing items that reference this category id (stored as string)
        get_db().listing_items.delete_many({'categoryId': str(oid)})

        result = get_db().categories.delete_one({'_id': oid})
        if result.deleted_count == 0:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ListingItemViewSet(viewsets.ViewSet):
    serializer_class = ListingItemSerializer

    def list(self, request):
        docs = list(get_db().listing_items.find({}).sort('name', 1))
        payload = [
            {
                'id': str(doc['_id']),
                'name': doc.get('name', ''),
                'categoryId': doc.get('categoryId', ''),
                'categoryName': doc.get('categoryName', ''),
                'itemType': doc.get('itemType', 'item'),
            }
            for doc in docs
        ]
        return Response(payload, status=status.HTTP_200_OK)

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            category_oid = ObjectId(data['categoryId'])
        except Exception:
            return Response({'detail': 'Invalid category id.'}, status=status.HTTP_400_BAD_REQUEST)

        category_doc = get_db().categories.find_one({'_id': category_oid})
        if not category_doc:
            return Response({'detail': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)

        name = data['name'].strip()
        if not name:
            return Response({'name': ['This field may not be blank.']}, status=status.HTTP_400_BAD_REQUEST)

        doc = {
            'name': name,
            'categoryId': str(category_doc['_id']),
            'categoryName': category_doc.get('name', ''),
            'itemType': data['itemType'],
        }
        result = get_db().listing_items.insert_one(doc)
        return Response(
            {
                'id': str(result.inserted_id),
                'name': doc['name'],
                'categoryId': doc['categoryId'],
                'categoryName': doc['categoryName'],
                'itemType': doc['itemType'],
            },
            status=status.HTTP_201_CREATED,
        )

    def destroy(self, request, pk=None):
        try:
            oid = ObjectId(pk)
        except Exception:
            return Response({'detail': 'Invalid listing item id.'}, status=status.HTTP_400_BAD_REQUEST)

        result = get_db().listing_items.delete_one({'_id': oid})
        if result.deleted_count == 0:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderViewSet(viewsets.ViewSet):
    serializer_class = OrderSerializer

    def _serialize_order(self, doc, include_toggled_items=False):
        created_at = doc.get('createdAt')
        if isinstance(created_at, datetime):
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            created_at = created_at.astimezone(timezone.utc).isoformat().replace('+00:00', 'Z')
        payload = {
            'id': str(doc['_id']),
            'orderNumber': doc.get('orderNumber', ''),
            'table': doc.get('table', ''),
            'items': doc.get('items', []),
            'status': doc.get('status', 'active'),
            'createdAt': created_at,
        }
        if include_toggled_items:
            payload['toggledItems'] = doc.get('toggledItems', {})
        return payload

    def list(self, request):
        docs = list(get_db().orders.find({'status': 'active'}).sort('createdAt', 1))
        include_toggled_items = request.query_params.get('includeToggles', '').lower() in {'1', 'true', 'yes'}
        return Response([self._serialize_order(doc, include_toggled_items=include_toggled_items) for doc in docs], status=status.HTTP_200_OK)

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        now = datetime.now(timezone.utc)
        order_number = now.strftime('ORD-%Y%m%d-%H%M%S')
        payload = {
            'orderNumber': order_number,
            'table': serializer.validated_data.get('table', ''),
            'items': serializer.validated_data['items'],
            'toggledItems': {},
            'status': 'active',
            'createdAt': now,
        }
        result = get_db().orders.insert_one(payload)
        payload['_id'] = result.inserted_id
        return Response(self._serialize_order(payload, include_toggled_items=True), status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        try:
            oid = ObjectId(pk)
        except Exception:
            return Response({'detail': 'Invalid order id.'}, status=status.HTTP_400_BAD_REQUEST)

        result = get_db().orders.update_one({'_id': oid}, {'$set': {'status': 'done'}})
        if result.matched_count == 0:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def partial_update(self, request, pk=None):
        # Allow updating toggledItems map on an order so other frontends can sync
        try:
            oid = ObjectId(pk)
        except Exception:
            return Response({'detail': 'Invalid order id.'}, status=status.HTTP_400_BAD_REQUEST)

        toggled = request.data.get('toggledItems')
        if toggled is None:
            return Response({'detail': 'toggledItems required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure it's a dict-like mapping
        if not isinstance(toggled, dict):
            return Response({'detail': 'toggledItems must be an object mapping indices to booleans.'}, status=status.HTTP_400_BAD_REQUEST)

        result = get_db().orders.update_one({'_id': oid}, {'$set': {'toggledItems': toggled}})
        if result.matched_count == 0:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        doc = get_db().orders.find_one({'_id': oid})
        return Response(self._serialize_order(doc, include_toggled_items=True), status=status.HTTP_200_OK)
