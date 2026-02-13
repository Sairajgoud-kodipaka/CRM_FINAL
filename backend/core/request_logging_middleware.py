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
            logger.info(
                f"API Request started: {request.method} {request.path}",
                request=request
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
            logger.error(
                f"API Request failed with server error: {request.method} {request.path} - "
                f"Status {status_code} - Duration {duration_ms:.2f}ms",
                request=request,
                status_code=status_code,
                duration_ms=duration_ms
            )
        elif status_code >= 400:
            # Client errors - log as warning
            logger.warning(
                f"API Request failed with client error: {request.method} {request.path} - "
                f"Status {status_code} - Duration {duration_ms:.2f}ms",
                request=request,
                status_code=status_code,
                duration_ms=duration_ms
            )
        elif request.method in self.DETAILED_METHODS:
            # Successful important operations - log as info
            logger.info(
                f"API Request completed successfully: {request.method} {request.path} - "
                f"Status {status_code} - Duration {duration_ms:.2f}ms",
                request=request,
                status_code=status_code,
                duration_ms=duration_ms
            )
        elif duration_ms > 1000:
            # Slow requests (>1 second) - log as warning
            logger.warning(
                f"Slow API Request detected: {request.method} {request.path} - "
                f"Status {status_code} - Duration {duration_ms:.2f}ms",
                request=request,
                status_code=status_code,
                duration_ms=duration_ms
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
        logger.error(
            f"Unhandled exception in API request: {request.method} {request.path} - "
            f"Exception: {type(exception).__name__} - Duration {duration_ms:.2f}ms",
            request=request,
            exception=exception,
            exc_info=True,
            duration_ms=duration_ms
        )
        
        return None
