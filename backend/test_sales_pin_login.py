import io
from PIL import Image
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from apps.users.models import User
from apps.products.models import Product


@override_settings(SALES_PIN_LOGIN_ENABLED=True, SALES_PIN_CODE='1234')
class SalesPinLoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.sales_user = User.objects.create_user(
            username='sales1', password='password123', role='inhouse_sales', is_active=True
        )
        self.non_sales_user = User.objects.create_user(
            username='admin1', password='admin123', role='business_admin', is_active=True
        )

    def test_sales_user_can_login_with_pin(self):
        url = reverse('users:sales_pin_login')
        resp = self.client.post(url, {'username': 'sales1', 'pin': '1234'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data.get('success'))
        self.assertIn('token', resp.data)

    def test_non_sales_user_cannot_login_with_pin(self):
        url = reverse('users:sales_pin_login')
        resp = self.client.post(url, {'username': 'admin1', 'pin': '1234'}, format='json')
        self.assertEqual(resp.status_code, 403)


@override_settings(MEDIA_ROOT='/tmp/test_media')
class ImageUploadCompatibilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='ba1', password='admin123', role='business_admin', is_active=True
        )
        # Obtain token via normal login
        login_url = reverse('users:login')
        resp = self.client.post(login_url, {'username': 'ba1', 'password': 'admin123'}, format='json')
        token = resp.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def _create_image_file(self, color=(255, 0, 0)):
        image = Image.new('RGB', (100, 100), color=color)
        buf = io.BytesIO()
        image.save(buf, format='PNG')
        buf.seek(0)
        buf.name = 'test.png'
        return buf

    def test_product_create_with_gallery_image(self):
        url = reverse('products:product-create')
        data = {
            'name': 'Test Product',
            'sku': 'SKU123',
            'description': 'desc',
            'cost_price': '10',
            'selling_price': '20',
            'quantity': '5',
            'min_quantity': '0',
            'max_quantity': '999',
        }
        data['main_image'] = self._create_image_file()
        resp = self.client.post(url, data, format='multipart')
        self.assertIn(resp.status_code, (201, 200))

    def test_product_create_with_camera_image(self):
        # Camera capture is also a file upload; reuse same path
        url = reverse('products:product-create')
        data = {
            'name': 'Test Product 2',
            'sku': 'SKU124',
            'description': 'desc',
            'cost_price': '10',
            'selling_price': '20',
            'quantity': '5',
            'min_quantity': '0',
            'max_quantity': '999',
        }
        data['main_image'] = self._create_image_file(color=(0, 255, 0))
        resp = self.client.post(url, data, format='multipart')
        self.assertIn(resp.status_code, (201, 200))


