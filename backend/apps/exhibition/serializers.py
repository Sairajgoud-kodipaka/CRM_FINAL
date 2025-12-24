from rest_framework import serializers
from .models import Exhibition, ExhibitionTag


class ExhibitionTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExhibitionTag
        fields = ['id', 'name', 'color', 'is_active', 'tenant', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'tenant']


class ExhibitionSerializer(serializers.ModelSerializer):
    tag_name = serializers.CharField(source='tag.name', read_only=True)
    tag_color = serializers.CharField(source='tag.color', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Exhibition
        fields = [
            'id', 'name', 'date', 'tag', 'tag_name', 'tag_color',
            'tenant', 'description', 'location', 'is_active',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

