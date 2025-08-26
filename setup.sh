#!/bin/bash

# JulyCrm Setup Script
# This script will install all dependencies and set up the development environment

echo "🚀 Starting JulyCrm Setup..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    elif command -v python &> /dev/null; then
        PYTHON_VERSION=$(python --version)
        print_success "Python found: $PYTHON_VERSION"
    else
        print_error "Python is not installed. Please install Python 3.8+ first."
        exit 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
}

# Setup Backend
setup_backend() {
    print_status "Setting up Backend (Django)..."
    cd backend
    
    # Create virtual environment
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install Python dependencies
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create .env file from example
    if [ ! -f .env ]; then
        print_status "Creating .env file from example..."
        cp env.example .env
        print_warning "Please update the .env file with your database credentials and other settings."
    fi
    
    # Run Django migrations
    print_status "Running Django migrations..."
    python manage.py migrate
    
    # Create superuser (optional)
    print_status "Creating superuser..."
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'admin123') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell
    
    print_success "Backend setup completed!"
    cd ..
}

# Setup Frontend
setup_frontend() {
    print_status "Setting up Frontend (Next.js)..."
    cd jewellery-crm
    
    # Install Node.js dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create .env.local file if it doesn't exist
    if [ ! -f .env.local ]; then
        print_status "Creating .env.local file..."
        cat > .env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database (if needed)
DATABASE_URL=your-database-url-here
EOF
        print_warning "Please update the .env.local file with your configuration."
    fi
    
    print_success "Frontend setup completed!"
    cd ..
}

# Create run scripts
create_run_scripts() {
    print_status "Creating run scripts..."
    
    # Backend run script
    cat > run_backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
python manage.py runserver 8000
EOF
    chmod +x run_backend.sh
    
    # Frontend run script
    cat > run_frontend.sh << 'EOF'
#!/bin/bash
cd jewellery-crm
npm run dev
EOF
    chmod +x run_frontend.sh
    
    # Combined run script
    cat > run_both.sh << 'EOF'
#!/bin/bash
# Run both backend and frontend in parallel
echo "Starting both backend and frontend..."
./run_backend.sh &
BACKEND_PID=$!
./run_frontend.sh &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    chmod +x run_both.sh
    
    print_success "Run scripts created!"
}

# Create requirements.txt if it doesn't exist
create_requirements() {
    if [ ! -f backend/requirements.txt ]; then
        print_status "Creating requirements.txt file..."
        cat > backend/requirements.txt << 'EOF'
Django==4.2.7
djangorestframework==3.14.0
django-cors-headers==4.3.1
djangorestframework-simplejwt==5.3.0
Pillow==10.0.1
python-decouple==3.8
psycopg2-binary==2.9.7
django-filter==23.3
django-extensions==3.2.3
celery==5.3.4
redis==5.0.1
django-celery-beat==2.5.0
django-celery-results==2.5.1
channels==4.0.0
channels-redis==4.1.0
daphne==4.0.0
django-storages==1.14.2
boto3==1.29.3
django-ckeditor==6.7.0
django-taggit==4.0.0
django-import-export==3.3.4
django-debug-toolbar==4.2.0
django-extensions==3.2.3
django-filter==23.3
django-cors-headers==4.3.1
djangorestframework-simplejwt==5.3.0
Pillow==10.0.1
python-decouple==3.8
psycopg2-binary==2.9.7
celery==5.3.4
redis==5.0.1
django-celery-beat==2.5.0
django-celery-results==2.5.1
channels==4.0.0
channels-redis==4.1.0
daphne==4.0.0
django-storages==1.14.2
boto3==1.29.3
django-ckeditor==6.7.0
django-taggit==4.0.0
django-import-export==3.3.4
django-debug-toolbar==4.2.0
EOF
        print_success "requirements.txt created!"
    fi
}

# Main setup function
main() {
    echo "🎯 JulyCrm Development Environment Setup"
    echo "========================================"
    echo ""
    
    # Check prerequisites
    check_python
    check_node
    check_npm
    
    echo ""
    print_status "Starting setup process..."
    
    # Create requirements.txt if needed
    create_requirements
    
    # Setup backend
    setup_backend
    
    # Setup frontend
    setup_frontend
    
    # Create run scripts
    create_run_scripts
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo "================================"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Update backend/.env with your database settings"
    echo "2. Update jewellery-crm/.env.local with your API configuration"
    echo "3. Run the application using one of the following commands:"
    echo "   - ./run_backend.sh (backend only)"
    echo "   - ./run_frontend.sh (frontend only)"
    echo "   - ./run_both.sh (both backend and frontend)"
    echo ""
    echo "🌐 Access URLs:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:8000"
    echo "   - Django Admin: http://localhost:8000/admin"
    echo ""
    echo "🔑 Default Admin Credentials:"
    echo "   - Username: admin"
    echo "   - Password: admin123"
    echo ""
    echo "📚 Documentation:"
    echo "   - Check the README.md files in each directory"
    echo "   - API documentation available at http://localhost:8000/api/"
    echo ""
}

# Run the setup
main 