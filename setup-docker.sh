#!/bin/bash
# Food for Everyone - Docker Setup Script
# Run this script to set up Docker configuration automatically

echo "🐳 Food for Everyone - Docker Setup"
echo "====================================="
echo ""

# Function to generate random password
generate_password() {
    cat /dev/urandom | tr -dc 'a-zA-Z0-9!@#$%^&*' | fold -w 20 | head -n 1
}

# Function to generate JWT secret
generate_jwt_secret() {
    cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1
}

# Check if Docker is installed
echo "✓ Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "  ❌ Docker is not installed!"
    echo "  Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "  Docker is installed ✓"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "  ❌ Docker Compose is not available!"
    exit 1
fi
echo "  Docker Compose is available ✓"

echo ""
echo "✓ Generating secure passwords and secrets..."

# Generate passwords
MYSQL_ROOT_PASSWORD=$(generate_password)
MYSQL_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_jwt_secret)

echo "  Generated secure credentials ✓"

# Create .env file
echo ""
echo "✓ Creating .env file..."

cat > .env << EOF
# Docker Environment Variables
# Generated on: $(date '+%Y-%m-%d %H:%M:%S')

# MySQL Database Configuration
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_USER=fooduser
MYSQL_PASSWORD=$MYSQL_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET

# CORS Configuration
CORS_ORIGIN=http://localhost

# Stripe Configuration (Optional - add your keys if needed)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_SUCCESS_URL=http://localhost/checkout/success
STRIPE_CANCEL_URL=http://localhost/checkout/cancel

# Frontend API Configuration
VITE_API_BASE_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4001
EOF

echo "  Created .env file ✓"

# Save credentials to a separate file for reference
cat > CREDENTIALS.txt << EOF
# IMPORTANT: Keep these credentials safe!
# Generated on: $(date '+%Y-%m-%d %H:%M:%S')

MySQL Root Password: $MYSQL_ROOT_PASSWORD
MySQL User: fooduser
MySQL Password: $MYSQL_PASSWORD
JWT Secret: $JWT_SECRET

Access URLs:
- Frontend: http://localhost
- Backend API: http://localhost:4000
- Database: localhost:3306

Database Connection String:
mysql://fooduser:$MYSQL_PASSWORD@localhost:3306/food_for_everyone
EOF

echo "  Saved credentials to CREDENTIALS.txt ✓"

echo ""
echo "✓ Verifying Docker files..."

# Check if required Docker files exist
required_files=(
    "docker-compose.yml"
    "apps/backend/Dockerfile"
    "apps/web/Dockerfile"
    "apps/web/nginx.conf"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "  ❌ Missing Docker files:"
    for file in "${missing_files[@]}"; do
        echo "    - $file"
    done
    echo ""
    echo "Please ensure all Docker configuration files are present."
    exit 1
fi

echo "  All Docker files present ✓"

echo ""
echo "====================================="
echo "✅ Setup Complete!"
echo "====================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start Docker (if not running)"
echo ""
echo "2. Build and start all services:"
echo "   docker-compose up -d"
echo ""
echo "3. Check service status:"
echo "   docker-compose ps"
echo ""
echo "4. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "5. Access the application:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost:4000"
echo ""
echo "📝 Your credentials are saved in CREDENTIALS.txt"
echo ""
echo "📖 For more information, see DOCKER_GUIDE.md"
echo ""

# Ask if user wants to start Docker Compose now
read -p "Would you like to start the application now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting Docker Compose..."
    docker-compose up -d
    
    echo ""
    echo "⏳ Waiting for services to start (this may take a few minutes)..."
    sleep 10
    
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    
    echo ""
    echo "✅ Application is starting!"
    echo ""
    echo "Access your application at: http://localhost"
    echo ""
    echo "To view logs: docker-compose logs -f"
else
    echo ""
    echo "Run 'docker-compose up -d' when you're ready to start."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
