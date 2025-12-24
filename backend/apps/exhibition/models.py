from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class ExhibitionTag(models.Model):
    """
    Exhibition Tag model for categorizing exhibitions.
    Tenant-specific tags for organizing exhibitions.
    """
    name = models.CharField(max_length=100, help_text=_('Tag name'))
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='exhibition_tags',
        null=True,
        blank=True
    )
    color = models.CharField(
        max_length=7,
        default='#3B82F6',
        help_text=_('Tag color in hex format')
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Exhibition Tag')
        verbose_name_plural = _('Exhibition Tags')
        ordering = ['name']
        unique_together = ['name', 'tenant']

    def __str__(self):
        return self.name


class Exhibition(models.Model):
    """
    Exhibition model for managing exhibitions.
    Tenant-specific exhibitions with tags.
    """
    name = models.CharField(max_length=200, help_text=_('Exhibition name'))
    date = models.DateField(help_text=_('Date of the exhibition'))
    tag = models.ForeignKey(
        ExhibitionTag,
        on_delete=models.SET_NULL,
        related_name='exhibitions',
        null=True,
        blank=True,
        help_text=_('Exhibition tag')
    )
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='exhibitions',
        null=True,
        blank=True
    )
    description = models.TextField(blank=True, null=True, help_text=_('Exhibition description'))
    location = models.CharField(max_length=200, blank=True, null=True, help_text=_('Exhibition location'))
    is_active = models.BooleanField(default=True, help_text=_('Only active exhibitions are shown'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_exhibitions'
    )

    class Meta:
        verbose_name = _('Exhibition')
        verbose_name_plural = _('Exhibitions')
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.name} - {self.date}"
