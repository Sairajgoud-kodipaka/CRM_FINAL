# 🚀 Jewellery CRM Deployment Checklist

## 📋 Pre-Deployment Verification

### Backend (Django) ✅
- [x] `python manage.py check --deploy` passes
- [x] CORS configuration tested and working
- [x] Health check endpoint responding
- [x] API endpoints accessible
- [x] Security headers configured
- [x] Static files collection working
- [x] Build script ready
- [x] Schema generation temporarily disabled (for deployment)

### Frontend (Next.js) ✅
- [x] Vercel configuration ready
- [x] Environment variables template created
- [x] Build command configured
- [x] API URL configuration ready

## 🎯 Deployment Order

### 1. Backend First (Render)
**Why**: Frontend needs backend URL for environment variables

**Steps:**
1. [ ] Create PostgreSQL database in Render
2. [ ] Deploy backend service using `render.yaml`
3. [ ] Set environment variables in Render dashboard
4. [ ] Verify health check endpoint: `https://your-backend.onrender.com/api/health/`
5. [ ] Test API endpoints with authentication

**Environment Variables to Set:**
```bash
DEBUG=False
SECRET_KEY=<generated-by-render>
ALLOWED_HOSTS=crm-final-mfe4.onrender.com
CORS_ALLOWED_ORIGINS=https://crm-final-five.vercel.app
CSRF_TRUSTED_ORIGINS=https://crm-final-five.vercel.app
DB_NAME=jewellery_crm
DB_USER=jewellery_crm_user
DB_PASSWORD=<your-database-password>
DB_HOST=<your-render-postgres-host>
DB_PORT=5432
```

### 2. Frontend Second (Vercel)
**Why**: Now we have the backend URL

**Steps:**
1. [ ] Deploy to Vercel with root directory `jewellery-crm`
2. [ ] Set environment variables in Vercel dashboard
3. [ ] Verify build success
4. [ ] Test frontend-backend connection

**Environment Variables to Set:**
```bash
NEXT_PUBLIC_API_URL=https://crm-final-mfe4.onrender.com
NEXT_PUBLIC_SITE_URL=https://crm-final-five.vercel.app
NEXTAUTH_URL=https://crm-final-five.vercel.app
NEXTAUTH_SECRET=<your-secret-key>
```

## 🔍 Post-Deployment Testing

### Backend Tests
- [ ] Health check: `https://crm-final-mfe4.onrender.com/api/health/`
- [ ] Admin panel: `https://crm-final-mfe4.onrender.com/admin/`
- [ ] API endpoints responding (with authentication)
- [ ] CORS headers present
- [ ] Security headers configured
- [ ] Static files served correctly
- [ ] Database migrations completed

### Frontend Tests
- [ ] Homepage loads without errors
- [ ] API calls to backend working
- [ ] Authentication flow working
- [ ] No CORS errors in browser console
- [ ] All pages accessible

### Integration Tests
- [ ] Login/logout functionality
- [ ] Data fetching from backend
- [ ] File uploads working
- [ ] Real-time features (if any)

## 🚨 Common Issues & Quick Fixes

### Backend Issues
1. **Build Failures**
   - Check Python version compatibility
   - Verify `requirements.txt` is complete
   - Check build script permissions

2. **Database Connection Errors**
   - Verify PostgreSQL credentials
   - Check database host accessibility
   - Ensure database exists

3. **CORS Errors**
   - Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
   - Check `CSRF_TRUSTED_ORIGINS` configuration

### Frontend Issues
1. **Build Failures**
   - Check Node.js version
   - Verify all dependencies installed
   - Check for TypeScript errors

2. **API Connection Errors**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check backend is running and accessible
   - Verify CORS configuration

## 📊 Monitoring Setup

### Render Monitoring
- [ ] Health check alerts configured
- [ ] Log monitoring enabled
- [ ] Performance metrics tracked

### Vercel Monitoring
- [ ] Function logs monitored
- [ ] Performance analytics enabled
- [ ] Error tracking configured

## 🔧 Post-Deployment Improvements

### Re-enable API Documentation
After successful deployment:
1. [ ] Uncomment DRF Spectacular in `settings.py`
2. [ ] Uncomment schema URLs in `urls.py`
3. [ ] Fix Product model field issue
4. [ ] Test schema generation

### Performance Optimization
1. [ ] Enable Redis caching
2. [ ] Configure CDN for static files
3. [ ] Implement database connection pooling
4. [ ] Add request rate limiting

## 📞 Emergency Contacts

- **Backend Issues**: Check Render logs and Django error logs
- **Frontend Issues**: Check Vercel function logs and browser console
- **Database Issues**: Check Render PostgreSQL logs
- **CORS Issues**: Verify environment variables and Django CORS settings

## 🎉 Success Criteria

**Deployment is successful when:**
- [ ] Frontend loads without errors
- [ ] Backend API responds correctly
- [ ] Database operations working
- [ ] Authentication flow functional
- [ ] No CORS errors in production
- [ ] Health checks passing
- [ ] All critical features working

---

**Ready to Deploy! 🚀**

**Next Step**: Start with backend deployment on Render
