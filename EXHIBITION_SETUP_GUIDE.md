# 🚀 Exhibition Lead Management System - Setup Guide

## 🎯 Overview
This guide will help you set up and test the Exhibition Lead Management System. The system includes both backend (Django) and frontend (Next.js) components.

## 📋 Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- Django project running
- Next.js frontend running

## 🔧 Backend Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Activate Virtual Environment
```bash
# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (if needed)
```bash
python manage.py createsuperuser
```

### 6. Test the Backend
```bash
python test_exhibition.py
```

### 7. Start Django Server
```bash
python manage.py runserver
```

## 🌐 Frontend Setup

### 1. Navigate to Frontend Directory
```bash
cd jewellery-crm
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

## 🧪 Testing the System

### 1. Backend API Testing
The system provides these API endpoints:

- **GET** `/api/exhibition/exhibition-leads/` - List all exhibition leads
- **GET** `/api/exhibition/exhibition-leads/stats/` - Get exhibition statistics
- **POST** `/api/exhibition/exhibition-leads/{id}/promote/` - Promote a lead
- **POST** `/api/exhibition/exhibition-leads/bulk_promote/` - Bulk promote leads
- **GET** `/api/exhibition/exhibition-leads/export/` - Export leads to CSV

### 2. Frontend Testing
Navigate to these routes in your browser:

- **`/exhibition`** - Main exhibition leads management page
- **`/business-admin/*`** - Business admin dashboard (includes exhibition menu)
- **`/manager/*`** - Manager dashboard (includes exhibition menu)

### 3. Test Workflow
1. **Create Exhibition Lead**: Use the "Capture Lead" button
2. **View Leads**: See all exhibition leads in the list
3. **Promote Lead**: Click "Promote to Main Customer" button
4. **Verify Promotion**: Check that lead status changes from 'exhibition' to 'lead'

## 🔍 System Components

### Backend Components
- **Models**: Extended Client model with exhibition status
- **Views**: ExhibitionLeadViewSet with specialized endpoints
- **Admin**: Enhanced admin interface for exhibition leads
- **Signals**: Automatic status management and logging
- **URLs**: Exhibition-specific API routing

### Frontend Components
- **ExhibitionPage**: Main exhibition leads management page
- **ExhibitionLeadModal**: Quick lead capture modal
- **CustomerDetailModal**: Enhanced with promotion button
- **Navigation**: Added to sidebar for business admin and manager roles

## 🚨 Troubleshooting

### Common Issues

#### 1. Migration Errors
```bash
# Reset migrations if needed
python manage.py migrate clients zero
python manage.py migrate clients
```

#### 2. Import Errors
```bash
# Check if exhibition app is in INSTALLED_APPS
# Add to settings.py if missing:
INSTALLED_APPS = [
    ...
    'apps.exhibition',
    ...
]
```

#### 3. API Endpoint Not Found
- Verify URLs are properly included in `core/urls.py`
- Check that exhibition app is properly configured
- Ensure Django server is running

#### 4. Frontend API Errors
- Check API base URL in `api-service.ts`
- Verify backend server is running on correct port
- Check browser console for CORS errors

### Debug Commands

#### Backend Debug
```bash
# Check Django logs
python manage.py runserver --verbosity=2

# Test exhibition functionality
python test_exhibition.py

# Check admin interface
python manage.py runserver
# Navigate to /admin
```

#### Frontend Debug
```bash
# Check Next.js logs
npm run dev

# Check browser console for errors
# Verify API calls in Network tab
```

## 📊 Database Schema

### Client Model Updates
```python
class Status(models.TextChoices):
    LEAD = 'lead', _('Lead')
    PROSPECT = 'prospect', _('Prospect')
    CUSTOMER = 'customer', _('Customer')
    INACTIVE = 'inactive', _('Inactive')
    EXHIBITION = 'exhibition', _('Exhibition')  # NEW

class Source(models.TextChoices):
    WEBSITE = 'website', _('Website')
    REFERRAL = 'referral', _('Referral')
    SOCIAL_MEDIA = 'social_media', _('Social Media')
    ADVERTISING = 'advertising', _('Advertising')
    COLD_CALL = 'cold_call', _('Cold Call')
    EXHIBITION = 'exhibition', _('Exhibition')  # NEW
    OTHER = 'other', _('Other')
```

## 🔐 Access Control

### User Roles
- **Business Admin**: Full access to exhibition system
- **Manager**: Full access to exhibition system
- **Other Roles**: Access based on existing customer permissions

### API Permissions
- Exhibition endpoints require manager or business admin role
- Uses existing permission system with role-based access

## 📈 Performance Considerations

### Database Optimization
- Exhibition leads are filtered efficiently using database queries
- Pagination support for large datasets
- Indexed fields for fast searching

### API Optimization
- Cached statistics for dashboard
- Efficient filtering and search
- Bulk operations for multiple leads

## 🔮 Future Enhancements

### Planned Features
- **Bulk Operations**: Promote multiple leads at once
- **Lead Scoring**: Automatic quality assessment
- **Follow-up Scheduling**: Automatic reminder system
- **Analytics Dashboard**: Exhibition performance metrics
- **Export Options**: Multiple format support

### Customization Options
- **Field Configuration**: Add/remove capture fields
- **Workflow Rules**: Custom promotion criteria
- **Notification System**: Alerts for new leads
- **Integration**: Connect with exhibition management tools

## 📞 Support

### Getting Help
1. **Check Logs**: Backend and frontend error logs
2. **Test Scripts**: Run `python test_exhibition.py`
3. **Documentation**: Refer to this guide and README files
4. **Development Team**: Contact for technical issues

### Reporting Issues
When reporting issues, include:
- Error messages and stack traces
- Steps to reproduce the problem
- Environment details (OS, Python version, etc.)
- Screenshots if applicable

---

## 🎉 Success Checklist

- [ ] Backend migrations completed successfully
- [ ] Django server starts without errors
- [ ] Exhibition API endpoints respond correctly
- [ ] Frontend builds and runs without errors
- [ ] Exhibition page loads correctly
- [ ] Lead capture functionality works
- [ ] Lead promotion functionality works
- [ ] Admin interface shows exhibition leads
- [ ] Navigation includes exhibition menu items

**🎯 Congratulations! Your Exhibition Lead Management System is now ready to use!**
