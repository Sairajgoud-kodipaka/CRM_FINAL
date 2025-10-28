"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Get Django ASGI application
django_asgi_app = get_asgi_application()

# Import routing after Django is initialized
def get_websocket_urlpatterns():
    from telecalling.routing import websocket_urlpatterns as telecalling_ws
    from apps.notifications.routing import websocket_urlpatterns as notification_ws
    return telecalling_ws + notification_ws

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(
            get_websocket_urlpatterns()
        )
    ),
})
