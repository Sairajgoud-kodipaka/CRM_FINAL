"""
Production-ready logging utilities for the CRM backend.

This module provides structured logging helpers that produce clear,
easy-to-understand log messages in plain English with proper context.
"""

import logging
import uuid
from typing import Optional, Dict, Any
from django.contrib.auth import get_user_model
from django.http import HttpRequest

User = get_user_model()

# Get logger for this module
logger = logging.getLogger(__name__)


class StructuredLogger:
    """
    A structured logger that creates easy-to-read log messages in plain English.
    """
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def _get_context(self, request: Optional[HttpRequest] = None, **kwargs) -> Dict[str, Any]:
        """Extract context information from request and kwargs."""
        context = {}
        
        if request:
            # Get user information
            if hasattr(request, 'user') and request.user.is_authenticated:
                context['user'] = {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': getattr(request.user, 'email', 'N/A'),
                    'role': getattr(request.user, 'role', 'N/A'),
                }
                
                # Get tenant information if available
                if hasattr(request.user, 'tenant') and request.user.tenant:
                    context['tenant'] = {
                        'id': request.user.tenant.id,
                        'name': request.user.tenant.name,
                    }
                
                # Get store information if available
                if hasattr(request.user, 'store') and request.user.store:
                    context['store'] = {
                        'id': request.user.store.id,
                        'name': request.user.store.name,
                    }
            
            # Get request information
            context['request'] = {
                'method': request.method,
                'path': request.path,
                'ip': self._get_client_ip(request),
            }
            
            # Get request ID if available
            if hasattr(request, 'request_id'):
                context['request_id'] = request.request_id
        
        # Add any additional context
        context.update(kwargs)
        
        return context
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip
    
    def _format_message(self, message: str, context: Dict[str, Any]) -> str:
        """Format log message with context in plain English."""
        parts = [message]
        
        # Add user context
        if 'user' in context:
            user = context['user']
            user_str = f"User: {user.get('username', 'Unknown')}"
            if user.get('role'):
                user_str += f" ({user['role']})"
            parts.append(user_str)
        
        # Add tenant context
        if 'tenant' in context:
            tenant = context['tenant']
            parts.append(f"Tenant: {tenant.get('name', 'Unknown')}")
        
        # Add request context
        if 'request' in context:
            req = context['request']
            parts.append(f"{req.get('method', 'UNKNOWN')} {req.get('path', 'Unknown')}")
            if req.get('ip') and req['ip'] != 'Unknown':
                parts.append(f"IP: {req['ip']}")
        
        # Add request ID if available
        if 'request_id' in context:
            parts.append(f"Request ID: {context['request_id']}")
        
        # Add any additional context (excluding sensitive data)
        sensitive_keys = {'password', 'token', 'secret', 'key', 'authorization'}
        for key, value in context.items():
            if key not in {'user', 'tenant', 'store', 'request', 'request_id'}:
                if not any(sensitive in key.lower() for sensitive in sensitive_keys):
                    if isinstance(value, (str, int, float, bool)):
                        parts.append(f"{key}: {value}")
                    elif isinstance(value, dict):
                        # Only include non-sensitive dict values
                        safe_dict = {k: v for k, v in value.items() 
                                   if not any(sensitive in k.lower() for sensitive in sensitive_keys)}
                        if safe_dict:
                            parts.append(f"{key}: {safe_dict}")
        
        return " | ".join(parts)
    
    def info(self, message: str, request: Optional[HttpRequest] = None, **kwargs):
        """Log an info message with context."""
        context = self._get_context(request, **kwargs)
        formatted_message = self._format_message(message, context)
        self.logger.info(formatted_message, extra={'context': context})
    
    def warning(self, message: str, request: Optional[HttpRequest] = None, **kwargs):
        """Log a warning message with context."""
        context = self._get_context(request, **kwargs)
        formatted_message = self._format_message(message, context)
        self.logger.warning(formatted_message, extra={'context': context})
    
    def error(self, message: str, request: Optional[HttpRequest] = None, exc_info: bool = False, **kwargs):
        """Log an error message with context."""
        context = self._get_context(request, **kwargs)
        formatted_message = self._format_message(message, context)
        self.logger.error(formatted_message, extra={'context': context}, exc_info=exc_info)
    
    def debug(self, message: str, request: Optional[HttpRequest] = None, **kwargs):
        """Log a debug message with context."""
        context = self._get_context(request, **kwargs)
        formatted_message = self._format_message(message, context)
        self.logger.debug(formatted_message, extra={'context': context})
    
    def critical(self, message: str, request: Optional[HttpRequest] = None, **kwargs):
        """Log a critical message with context."""
        context = self._get_context(request, **kwargs)
        formatted_message = self._format_message(message, context)
        self.logger.critical(formatted_message, extra={'context': context})


def get_logger(name: str) -> StructuredLogger:
    """
    Get a structured logger instance for a module.
    
    Usage:
        from core.logging_utils import get_logger
        logger = get_logger(__name__)
        logger.info("User logged in successfully", request=request)
    """
    return StructuredLogger(name)


# Convenience functions for common logging scenarios
def log_user_action(action: str, request: HttpRequest, **kwargs):
    """Log a user action with full context."""
    logger_instance = get_logger('user_actions')
    logger_instance.info(action, request=request, **kwargs)


def log_api_request(method: str, path: str, status_code: int, duration_ms: float, 
                   request: HttpRequest, **kwargs):
    """Log an API request with performance metrics."""
    logger_instance = get_logger('api_requests')
    message = f"API Request completed: {method} {path} - Status {status_code} - Duration {duration_ms:.2f}ms"
    logger_instance.info(message, request=request, status_code=status_code, 
                        duration_ms=duration_ms, **kwargs)


def log_error_with_context(error_message: str, request: Optional[HttpRequest] = None, 
                          exception: Optional[Exception] = None, **kwargs):
    """Log an error with full context and exception details."""
    logger_instance = get_logger('errors')
    logger_instance.error(
        error_message, 
        request=request, 
        exc_info=exception is not None,
        exception_type=type(exception).__name__ if exception else None,
        **kwargs
    )


def log_security_event(event_type: str, message: str, request: Optional[HttpRequest] = None, **kwargs):
    """Log a security-related event."""
    security_logger = logging.getLogger('security')
    logger_instance = StructuredLogger('security')
    logger_instance.warning(f"Security Event: {event_type} - {message}", request=request, **kwargs)
