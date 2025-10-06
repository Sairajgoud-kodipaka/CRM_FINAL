"""
Customer Segmentation API Views

Provides API endpoints for customer segmentation functionality.
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .segmentation_service import CustomerSegmentationService
from .models import Client, CustomerTag
from apps.users.middleware import ScopedVisibilityMixin


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # Temporarily disabled for testing
def get_segmentation_analytics(request):
    """
    Get customer segmentation analytics.
    
    Query Parameters:
    - view_type: "buckets" or "filters" (default: "buckets")
    - tenant_id: Optional tenant filter
    """
    try:
        view_type = request.query_params.get('view_type', 'buckets')
        tenant_id = request.query_params.get('tenant_id')
        
        # Get tenant from user if not provided
        if not tenant_id and hasattr(request.user, 'tenant'):
            tenant_id = request.user.tenant.id
        
        # Initialize segmentation service
        service = CustomerSegmentationService(tenant_id=tenant_id)
        
        # Get customers with segmentation data
        customers = service.get_customers_with_segmentation_data()
        
        # Apply segmentation rules
        segmented_customers = service.apply_segmentation_rules(customers, view_type)
        
        # Generate analytics
        analytics = service.get_segment_analytics(segmented_customers)
        
        return Response({
            'success': True,
            'data': {
                'customers': segmented_customers,
                'analytics': analytics,
                'view_type': view_type
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # Temporarily disabled for testing
def get_segment_customers(request, segment_name):
    """
    Get customers for a specific segment.
    
    Path Parameters:
    - segment_name: Name of the segment
    
    Query Parameters:
    - view_type: "buckets" or "filters" (default: "buckets")
    - tenant_id: Optional tenant filter
    - page: Page number for pagination
    - page_size: Number of customers per page
    """
    try:
        view_type = request.query_params.get('view_type', 'buckets')
        tenant_id = request.query_params.get('tenant_id')
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Get tenant from user if not provided
        if not tenant_id and hasattr(request.user, 'tenant'):
            tenant_id = request.user.tenant.id
        
        # Initialize segmentation service
        service = CustomerSegmentationService(tenant_id=tenant_id)
        
        # Get customers with segmentation data
        customers = service.get_customers_with_segmentation_data()
        
        # Apply segmentation rules
        segmented_customers = service.apply_segmentation_rules(customers, view_type)
        
        # Filter customers by segment
        segment_customers = [
            customer for customer in segmented_customers 
            if segment_name in customer.get('segments', [])
        ]
        
        # Pagination
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_customers = segment_customers[start_idx:end_idx]
        
        return Response({
            'success': True,
            'data': {
                'customers': paginated_customers,
                'total_count': len(segment_customers),
                'page': page,
                'page_size': page_size,
                'total_pages': (len(segment_customers) + page_size - 1) // page_size,
                'segment_name': segment_name
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # Temporarily disabled for testing
def get_segmentation_rules(request):
    """
    Get available segmentation rules and their configuration.
    """
    try:
        service = CustomerSegmentationService()
        
        return Response({
            'success': True,
            'data': {
                'rules': service.SEGMENTATION_RULES,
                'constraints': {
                    'mutually_exclusive_groups': service.MUTUALLY_EXCLUSIVE_GROUPS,
                    'priority_overrides': service.PRIORITY_OVERRIDES,
                    'exclusions': service.EXCLUSIONS
                }
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
# @permission_classes([IsAuthenticated])  # Temporarily disabled for testing
def create_custom_segment(request):
    """
    Create a custom customer segment.
    
    Request Body:
    {
        "name": "Segment Name",
        "description": "Segment description",
        "rules": {
            "field": "total_spent",
            "operator": ">=",
            "value": 50000
        },
        "category": "custom"
    }
    """
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['name', 'rules']
        for field in required_fields:
            if field not in data:
                return Response({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create custom tag
        tag = CustomerTag.objects.create(
            name=data['name'],
            slug=data['name'].lower().replace(' ', '-'),
            category=data.get('category', 'custom'),
            description=data.get('description', ''),
            is_active=True
        )
        
        return Response({
            'success': True,
            'data': {
                'tag': {
                    'id': tag.id,
                    'name': tag.name,
                    'slug': tag.slug,
                    'category': tag.category,
                    'description': tag.description
                }
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # Temporarily disabled for testing
def get_segmentation_insights(request):
    """
    Get detailed segmentation insights and recommendations.
    """
    try:
        tenant_id = request.query_params.get('tenant_id')
        
        # Get tenant from user if not provided
        if not tenant_id and hasattr(request.user, 'tenant'):
            tenant_id = request.user.tenant.id
        
        # Initialize segmentation service
        service = CustomerSegmentationService(tenant_id=tenant_id)
        
        # Get customers with segmentation data
        customers = service.get_customers_with_segmentation_data()
        
        # Apply segmentation rules
        segmented_customers = service.apply_segmentation_rules(customers, 'buckets')
        
        # Generate analytics
        analytics = service.get_segment_analytics(segmented_customers)
        
        # Generate insights
        insights = {
            'top_growing_segment': analytics['insights']['top_growing_segment'],
            'conversion_opportunity': analytics['insights']['conversion_opportunity'],
            'at_risk_customers': analytics['insights']['at_risk_customers'],
            'recommendations': _generate_recommendations(analytics)
        }
        
        return Response({
            'success': True,
            'data': insights
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _generate_recommendations(analytics):
    """Generate actionable recommendations based on segmentation data."""
    recommendations = []
    
    # At-risk customer recommendations
    at_risk_count = analytics['insights']['at_risk_customers']['count']
    if at_risk_count > 0:
        recommendations.append({
            'type': 'retention',
            'priority': 'high',
            'title': 'Re-engage At-Risk Customers',
            'description': f'You have {at_risk_count} at-risk customers who haven\'t purchased in over a year. Consider launching a re-engagement campaign.',
            'action': 'Create targeted WhatsApp campaigns for at-risk customers'
        })
    
    # Conversion opportunity recommendations
    conversion_rate = analytics['insights']['conversion_opportunity']['conversion_rate']
    if conversion_rate < 30:
        recommendations.append({
            'type': 'conversion',
            'priority': 'medium',
            'title': 'Improve Lead Conversion',
            'description': f'Your conversion rate is {conversion_rate}%. Focus on nurturing leads through the sales pipeline.',
            'action': 'Review lead qualification process and follow-up procedures'
        })
    
    # High-value customer recommendations
    high_value_count = analytics['segment_counts'].get('High-Value Buyer', 0)
    if high_value_count > 0:
        recommendations.append({
            'type': 'retention',
            'priority': 'high',
            'title': 'Retain High-Value Customers',
            'description': f'You have {high_value_count} high-value customers. Ensure they receive VIP treatment.',
            'action': 'Implement VIP customer program with exclusive benefits'
        })
    
    return recommendations
