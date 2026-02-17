"""
Request logging middleware for production.

This middleware logs all API requests with timing, status codes, and context
in a clear, easy-to-understand format.
"""

import time
import uuid
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpRequest, HttpResponse

from core.logging_utils import log_event_info, log_event_warning, log_event_error
from core.logging_utils import get_logger

logger = get_logger('request_logging')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all API requests with timing and context.
    
    Logs:
    - Request method and path
    - Response status code
    - Request duration
    - User information (if authenticated)
    - Request ID for tracing
    """
    
    # Paths to exclude from logging (health checks, static files, etc.)
    EXCLUDED_PATHS = [
        '/health',
        '/healthcheck',
        '/favicon.ico',
        '/static/',
        '/media/',
    ]
    
    # Methods to log in detail
    DETAILED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
    
    def process_request(self, request: HttpRequest):
        """Generate request ID and start timing."""
        # Skip logging for excluded paths
        if any(request.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return None
        
        # Generate unique request ID for tracing
        request.request_id = str(uuid.uuid4())[:8]
        request._start_time = time.time()
        
        # Log request start for important operations
        if request.method in self.DETAILED_METHODS and request.path.startswith('/api/'):
            log_event_info(
                logger,
                service="api",
                event="request.start",
                method=request.method,
                path=request.path,
                request_id=request.request_id,
            )
        
        return None
    
    def process_response(self, request: HttpRequest, response: HttpResponse):
        """Log request completion with timing and status."""
        # Skip logging for excluded paths
        if any(request.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return response
        
        # Calculate request duration
        if hasattr(request, '_start_time'):
            duration_ms = (time.time() - request._start_time) * 1000
        else:
            duration_ms = 0
        
        # Only log API requests
        if not request.path.startswith('/api/'):
            return response
        
        # Determine log level based on status code
        status_code = response.status_code
        
        # Log based on status code and method
        if status_code >= 500:
            # Server errors - always log
            log_event_error(
                logger,
                service="api",
                event="request.error_5xx",
                method=request.method,
                path=request.path,
                status=status_code,
                duration_ms=f"{duration_ms:.2f}",
                request_id=getattr(request, "request_id", None),
                note="unexpected server error – check traceback",
            )
        elif status_code >= 400:
            # Client errors - log as warning
            log_event_warning(
                logger,
                service="api",
                event="request.error_4xx",
                method=request.method,
                path=request.path,
                status=status_code,
                duration_ms=f"{duration_ms:.2f}",
                request_id=getattr(request, "request_id", None),
                note="client error – check request/permissions",
            )
        elif request.method in self.DETAILED_METHODS:
            # Successful important operations - log as info
            log_event_info(
                logger,
                service="api",
                event="request.success",
                method=request.method,
                path=request.path,
                status=status_code,
                duration_ms=f"{duration_ms:.2f}",
                request_id=getattr(request, "request_id", None),
                note="api request completed successfully",
            )
        elif duration_ms > 1000:
            # Slow requests (>1 second) - log as warning
            log_event_warning(
                logger,
                service="api",
                event="request.slow",
                method=request.method,
                path=request.path,
                status=status_code,
                duration_ms=f"{duration_ms:.2f}",
                request_id=getattr(request, "request_id", None),
                note="slow api request",
            )
        
        return response
    
    def process_exception(self, request: HttpRequest, exception: Exception):
        """Log exceptions that occur during request processing."""
        # Skip logging for excluded paths
        if any(request.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return None
        
        # Calculate duration if available
        if hasattr(request, '_start_time'):
            duration_ms = (time.time() - request._start_time) * 1000
        else:
            duration_ms = 0
        
        # Log exception with full context
        log_event_error(
            logger,
            service="api",
            event="request.exception",
            method=request.method,
            path=request.path,
            exception=type(exception).__name__,
            duration_ms=f"{duration_ms:.2f}",
            request_id=getattr(request, "request_id", None),
            note="unhandled exception in api request",
        )
        
        return None
