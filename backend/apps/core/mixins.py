# Global Date Filtering Mixin for All Views

from django.db.models import Q
from django.utils import timezone
from datetime import datetime

class GlobalDateFilterMixin:
    """
    Mixin that automatically applies date filtering to querysets
    when date filter parameters are present in the request.
    """
    
    def get_date_filtered_queryset(self, queryset, date_field='created_at'):
        """
        Apply date filtering to a queryset based on request parameters.
        
        Args:
            queryset: The queryset to filter
            date_field: The field to filter by (default: 'created_at')
        
        Returns:
            Filtered queryset
        """
        # Get date parameters from query params
        start_date_param = self.request.query_params.get('start_date')
        end_date_param = self.request.query_params.get('end_date')
        
        # If no date parameters, return original queryset
        if not start_date_param or not end_date_param:
            return queryset
        
        try:
            # Handle ISO datetime strings by extracting just the date part
            if 'T' in start_date_param:
                start_date_param = start_date_param.split('T')[0]
            if 'T' in end_date_param:
                end_date_param = end_date_param.split('T')[0]
            
            from datetime import datetime
            start_date = datetime.strptime(start_date_param, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = datetime.strptime(end_date_param, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            
            # Apply date filtering
            filter_kwargs = {
                f'{date_field}__gte': start_date,
                f'{date_field}__lte': end_date
            }
            
            filtered_queryset = queryset.filter(**filter_kwargs)
            
            print(f"📅 Date Filter Applied to {queryset.model.__name__}:")
            print(f"   Field: {date_field}")
            print(f"   Range: {start_date.date()} to {end_date.date()}")
            print(f"   Before: {queryset.count()} records")
            print(f"   After: {filtered_queryset.count()} records")
            
            return filtered_queryset
            
        except ValueError as e:
            print(f"❌ Invalid date format: {e}")
            return queryset
    
    def get_date_filtered_queryset_multiple_fields(self, queryset, date_fields):
        """
        Apply date filtering to multiple date fields (OR condition).
        
        Args:
            queryset: The queryset to filter
            date_fields: List of date fields to filter by
        
        Returns:
            Filtered queryset
        """
        # Get date parameters from query params
        start_date_param = self.request.query_params.get('start_date')
        end_date_param = self.request.query_params.get('end_date')
        
        # If no date parameters, return original queryset
        if not start_date_param or not end_date_param:
            return queryset
        
        try:
            # Handle ISO datetime strings by extracting just the date part
            if 'T' in start_date_param:
                start_date_param = start_date_param.split('T')[0]
            if 'T' in end_date_param:
                end_date_param = end_date_param.split('T')[0]
            
            from datetime import datetime
            start_date = datetime.strptime(start_date_param, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = datetime.strptime(end_date_param, '%Y-%m-%d').replace(hour=23, minute=59, second=59, microsecond=999999)
            
            # Create OR conditions for multiple date fields
            date_conditions = Q()
            for field in date_fields:
                date_conditions |= Q(**{
                    f'{field}__gte': start_date,
                    f'{field}__lte': end_date
                })
            
            filtered_queryset = queryset.filter(date_conditions)
            
            print(f"📅 Multi-Field Date Filter Applied to {queryset.model.__name__}:")
            print(f"   Fields: {date_fields}")
            print(f"   Range: {start_date.date()} to {end_date.date()}")
            print(f"   Before: {queryset.count()} records")
            print(f"   After: {filtered_queryset.count()} records")
            
            return filtered_queryset
            
        except ValueError as e:
            print(f"❌ Invalid date format: {e}")
            return queryset
