# 🚀 Jewellery CRM Deployment Guide

## Overview
This guide covers deploying your Jewellery CRM application with:
- **Frontend**: Next.js on Vercel
- **Backend**: Django on Render
- **Database**: PostgreSQL on Render

## 📋 Prerequisites

1. **GitHub Repository** with your code
2. **Vercel Account** (free tier available)
3. **Render Account** (free tier available)
4. **Domain** (optional, for custom URLs)

## 🎯 Frontend Deployment (Vercel)

### Step 1: Prepare Frontend
1. Ensure your `jewellery-crm/` directory is clean
2. Update `.env.local` with production values:
```bash
NEXT_PUBLIC_API_URL=https://crm-final-mfe4.onrender.com
NEXT_PUBLIC_SITE_URL=https://crm-final-five.vercel.app

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `jewellery-crm`
5. Configure build settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Environment Variables
Add these in Vercel dashboard:
```bash
NEXT_PUBLIC_API_URL=https://crm-final-mfe4.onrender.com
NEXT_PUBLIC_SITE_URL=https://crm-final-five.vercel.app
NEXTAUTH_URL=https://crm-final-five.vercel.app
NEXTAUTH_SECRET=your-secret-key
```

## 🔧 Backend Deployment (Render)

### Step 1: Prepare Backend
1. Ensure `backend/` directory is clean
2. Update `.env` with production values
3. Test locally: `python manage.py check --deploy`
4. **Note**: Schema generation is temporarily disabled for deployment (can be re-enabled later)

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `jewellery-crm-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`

### Step 3: Environment Variables
Add these in Render dashboard:
```bash
DEBUG=False
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=crm-final-mfe4.onrender.com
CORS_ALLOWED_ORIGINS=https://crm-final-five.vercel.app
CSRF_TRUSTED_ORIGINS=https://crm-final-five.vercel.app
DB_NAME=jewellery_crm
DB_USER=jewellery_crm_user
DB_PASSWORD=your-database-password
DB_HOST=your-render-postgres-host
DB_PORT=5432
```

### Step 4: Database Setup
1. Create PostgreSQL database in Render
2. Update database environment variables
3. Run migrations automatically via build script

## 🔗 Connecting Frontend & Backend

### Update API Calls
Ensure all API calls in your frontend use the environment variable:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

### CORS Configuration
Backend already configured to allow your Vercel domain.

## 📊 Monitoring & Health Checks

### Health Check Endpoint
- **URL**: `https://crm-final-mfe4.onrender.com/api/health/`
- **Purpose**: Render uses this for service monitoring

### Logs
- **Vercel**: Dashboard → Functions → Logs
- **Render**: Dashboard → Logs tab

## 🚨 Common Issues & Solutions

### Frontend Issues
1. **Build Failures**: Check Node.js version compatibility
2. **API Errors**: Verify `NEXT_PUBLIC_API_URL` is correct
3. **Environment Variables**: Ensure they're prefixed with `NEXT_PUBLIC_`

### Backend Issues
1. **Database Connection**: Verify PostgreSQL credentials
2. **Static Files**: Check `STATIC_ROOT` and `MEDIA_ROOT` paths
3. **CORS Errors**: Verify `CORS_ALLOWED_ORIGINS` includes your Vercel URL
4. **Schema Generation**: Temporarily disabled to avoid deployment issues
5. **Security Warnings**: Will be automatically resolved when `DEBUG=False` in production

### Performance Issues
1. **Cold Starts**: Render has cold start delays on free tier
2. **Database**: Consider upgrading to paid PostgreSQL plan
3. **Caching**: Implement Redis for session storage

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Secret Keys**: Use strong, unique secret keys
3. **HTTPS**: Both platforms provide SSL certificates
4. **CORS**: Restrict to only necessary origins

## 📈 Scaling Considerations

### Free Tier Limits
- **Vercel**: 100GB bandwidth/month
- **Render**: 750 hours/month for web services

### Paid Upgrades
- **Vercel Pro**: $20/month for team features
- **Render**: $7/month for web services, $7/month for databases

## 🎉 Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Backend API responds correctly
- [ ] Database migrations completed
- [ ] Static files served properly
- [ ] Health check endpoint working
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] SSL certificates active
- [ ] Monitoring alerts configured
- [ ] API endpoints responding (schema generation temporarily disabled)
- [ ] Security headers properly configured (automatic when DEBUG=False)

## 🔧 Post-Deployment Improvements

### Re-enabling API Schema Generation
After successful deployment, you can re-enable DRF Spectacular:

1. **Uncomment in `backend/core/settings.py`:**
   ```python
   INSTALLED_APPS = [
       # ... other apps
       'drf_spectacular',  # Re-enable this
   ]
   
   SPECTACULAR_SETTINGS = {
       'TITLE': 'Jewelry CRM API',
       'DESCRIPTION': 'A comprehensive CRM system for jewelry businesses',
       'VERSION': '1.0.0',
       'SERVE_INCLUDE_SCHEMA': True,  # Re-enable this
       'COMPONENT_SPLIT_REQUEST': True,
       'SCHEMA_PATH_PREFIX': '/api/',
   }
   ```

2. **Uncomment in `backend/core/urls.py`:**
   ```python
   from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
   
   # Re-enable schema URLs
   path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
   path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
   path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
   ```

3. **Fix the Product model field issue** (the `_` translation function conflict)

## 📞 Support Resources

- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Render**: [render.com/docs](https://render.com/docs)
- **Django**: [docs.djangoproject.com](https://docs.djangoproject.com)
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)

---

**Happy Deploying! 🚀**
