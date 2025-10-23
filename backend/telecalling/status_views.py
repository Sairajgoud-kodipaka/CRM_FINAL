from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from .automation_service import GoogleSheetsAutomationService
from .google_sheets_service import test_google_sheets_connection
from .models import Lead, WebhookLog
from apps.automation.models import ScheduledTask, TaskExecution
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def google_sheets_status(request):
    """Get Google Sheets integration status and acknowledgment messages"""
    try:
        user = request.user
        
        # Check if user has permission to view this information
        # Allow telecallers to see Google Sheets status since it affects their lead data
        if user.role not in ['manager', 'business_admin', 'platform_admin', 'tele_calling']:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get comprehensive status
        status_data = GoogleSheetsAutomationService.get_sync_status()
        
        # Add additional information
        total_leads = Lead.objects.count()
        assigned_leads = Lead.objects.filter(assigned_to__isnull=False).count()
        unassigned_leads = total_leads - assigned_leads
        
        # Get recent activity
        recent_activity = []
        
        # Add recent webhook logs
        recent_logs = WebhookLog.objects.filter(
            webhook_type='google_sheets'
        ).order_by('-created_at')[:10]
        
        for log in recent_logs:
            recent_activity.append({
                'type': 'sync',
                'status': log.status,
                'timestamp': log.created_at,
                'message': f"Google Sheets sync {log.status}",
                'details': log.error_message if log.status == 'failed' else None
            })
        
        # Add recent task executions
        sync_task = ScheduledTask.objects.filter(name='Google Sheets Lead Sync').first()
        if sync_task:
            recent_executions = TaskExecution.objects.filter(
                task=sync_task
            ).order_by('-created_at')[:5]
            
            for execution in recent_executions:
                recent_activity.append({
                    'type': 'automated_sync',
                    'status': execution.status,
                    'timestamp': execution.created_at,
                    'message': f"Automated sync {execution.status}",
                    'details': execution.error_message if execution.status == 'failed' else None
                })
        
        # Sort by timestamp
        recent_activity.sort(key=lambda x: x['timestamp'], reverse=True)
        
        response_data = {
            'connection_status': status_data.get('connection_status', False),
            'total_leads': total_leads,
            'assigned_leads': assigned_leads,
            'unassigned_leads': unassigned_leads,
            'automation_status': {
                'sync_task_active': sync_task.is_enabled if sync_task else False,
                'last_sync': sync_task.last_executed if sync_task else None,
                'success_rate': sync_task.success_rate if sync_task else 0,
            },
            'recent_activity': recent_activity[:10],  # Last 10 activities
            'acknowledgment_messages': GoogleSheetsAutomationService._get_acknowledgment_messages(),
            'last_updated': timezone.now()
        }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error getting Google Sheets status: {str(e)}")
        return Response({
            'error': 'Failed to get status',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_connection(request):
    """Test Google Sheets connection and provide acknowledgment"""
    try:
        user = request.user
        
        # Check if user has permission
        # Allow telecallers to test connection since it affects their lead data
        if user.role not in ['manager', 'business_admin', 'platform_admin', 'tele_calling']:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Test connection
        connection_ok = test_google_sheets_connection()
        
        # Get sample data for debugging
        sample_data = None
        if connection_ok:
            from .google_sheets_service import google_sheets_service
            sample_data = google_sheets_service.get_sheet_data("Sheet1!A:F")
        
        # Create webhook log for this test
        WebhookLog.objects.create(
            webhook_type='google_sheets',
            payload={'action': 'manual_connection_test', 'user': user.username},
            status='processed' if connection_ok else 'failed',
            processed_at=timezone.now() if connection_ok else None,
            error_message='' if connection_ok else 'Connection test failed'
        )
        
        if connection_ok:
            message = "✅ Google Sheets connection is working properly. Automated sync is active."
            status_code = status.HTTP_200_OK
        else:
            message = "❌ Google Sheets connection failed. Please check configuration and credentials."
            status_code = status.HTTP_400_BAD_REQUEST
        
        return Response({
            'connection_status': connection_ok,
            'message': message,
            'timestamp': timezone.now(),
            'sample_data': sample_data[:3] if sample_data else None  # First 3 rows for debugging
        }, status=status_code)
        
    except Exception as e:
        logger.error(f"Error testing connection: {str(e)}")
        return Response({
            'error': 'Failed to test connection',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sync_status(request):
    """Get detailed sync status and statistics"""
    try:
        user = request.user
        
        # Check if user has permission
        if user.role not in ['manager', 'business_admin', 'platform_admin', 'tele_calling']:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get comprehensive sync statistics
        from .models import Lead
        
        total_leads = Lead.objects.count()
        google_sheets_leads = Lead.objects.filter(source_system='google_sheets').count()
        assigned_leads = Lead.objects.filter(assigned_to__isnull=False).count()
        unassigned_leads = total_leads - assigned_leads
        
        # Get recent sync activity
        recent_logs = WebhookLog.objects.filter(
            webhook_type='google_sheets'
        ).order_by('-created_at')[:5]
        
        recent_activity = []
        for log in recent_logs:
            recent_activity.append({
                'timestamp': log.created_at,
                'status': log.status,
                'message': f"Sync {log.status}",
                'details': log.error_message if log.status == 'failed' else None
            })
        
        return Response({
            'total_leads': total_leads,
            'google_sheets_leads': google_sheets_leads,
            'assigned_leads': assigned_leads,
            'unassigned_leads': unassigned_leads,
            'recent_activity': recent_activity,
            'automation_note': 'Manual sync has been replaced with automated sync. Use the unified_sheets_sync management command for manual operations.',
            'timestamp': timezone.now()
        })
        
    except Exception as e:
        logger.error(f"Error getting sync status: {str(e)}")
        return Response({
            'error': 'Failed to get sync status',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
