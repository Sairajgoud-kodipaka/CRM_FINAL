# Global Date Filtering Middleware for All APIs

from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from datetime import datetime
from django.db.models import Q

class GlobalDateFilterMiddleware(MiddlewareMixin):
    """
    Middleware that automatically applies date filtering to all API endpoints
    when date parameters are present in the request.
    """
    
    def process_request(self, request):
        """Store date filter parameters in request for use by views"""
        if request.path.startswith('/api/'):
            # Extract date filter parameters
            start_date_param = request.GET.get('start_date')
            end_date_param = request.GET.get('end_date')
            filter_type = request.GET.get('filter_type', 'custom')
            
            if start_date_param and end_date_param:
                try:
                    # Parse dates - handle both timezone-aware and naive datetime strings
                    if start_date_param.endswith('Z'):
                        # Remove Z and parse as naive datetime, then make aware
                        start_date = timezone.make_aware(
                            datetime.fromisoformat(start_date_param.replace('Z', ''))
                        )
                    else:
                        # Already timezone-aware, just parse directly
                        start_date = datetime.fromisoformat(start_date_param.replace('Z', '+00:00'))
                    
                    if end_date_param.endswith('Z'):
                        # Remove Z and parse as naive datetime, then make aware
                        end_date = timezone.make_aware(
                            datetime.fromisoformat(end_date_param.replace('Z', ''))
                        )
                    else:
                        # Already timezone-aware, just parse directly
                        end_date = datetime.fromisoformat(end_date_param.replace('Z', '+00:00'))
                    
                    # Store in request for views to use
                    request.date_filter = {
                        'start_date': start_date,
                        'end_date': end_date,
                        'filter_type': filter_type,
                        'enabled': True
                    }
                    
                    print(f"🌍 Global Date Filter Applied:")
                    print(f"   Path: {request.path}")
                    print(f"   Start: {start_date}")
                    print(f"   End: {end_date}")
                    print(f"   Type: {filter_type}")
                    
                except (ValueError, TypeError) as e:
                    print(f"❌ Invalid date format: {e}")
                    request.date_filter = {'enabled': False}
            else:
                request.date_filter = {'enabled': False}
        
        return None
