from django.apps import AppConfig


class ExhibitionConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.exhibition'
    verbose_name = 'Exhibition Lead Management'
    
    def ready(self):
        """Import signals when the app is ready"""
        try:
            import apps.exhibition.signals
        except ImportError:
            pass
