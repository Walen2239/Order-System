from rest_framework import serializers


class CategorySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=100)
    kind = serializers.ChoiceField(choices=['goods', 'sauces'])
    allowSauce = serializers.BooleanField(required=False, default=False)


class ListingItemSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=100)
    categoryId = serializers.CharField()
    categoryName = serializers.CharField(read_only=True)
    itemType = serializers.ChoiceField(choices=['item', 'sauce'])


class OrderSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    orderNumber = serializers.CharField(read_only=True)
    table = serializers.CharField(max_length=50, allow_blank=True, required=False)
    items = serializers.ListField(child=serializers.JSONField(), allow_empty=False)
    status = serializers.CharField(read_only=True)
    createdAt = serializers.DateTimeField(read_only=True)
