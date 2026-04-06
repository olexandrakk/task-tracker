echo "Починаємо налаштування сервера..."

echo "Оновлення системи..."
sudo apt update && sudo apt upgrade -y

echo "Встановлення Nginx та бази даних..."
sudo apt install -y nginx postgresql postgresql-contrib

echo "Встановлення Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "Базові програми встановлено!"

echo "Налаштування бази даних PostgreSQL..."

sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'your_password';" || true
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE taskdb OWNER postgres;" || true

sudo -u postgres psql -d taskdb -f "$PWD/init.sql"

echo "Встановлення залежностей проєкту (npm install)..."
npm install

echo "Налаштування Nginx..."

sudo bash -c 'cat > /etc/nginx/sites-available/tasktracker <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/tasktracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "Встановлення та налаштування завершено успішно!"# 4. Налаштування PostgreSQL
echo "Налаштування бази даних PostgreSQL..."

sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'PesPatron';" || true
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE taskdb OWNER postgres;" || true

sudo -u postgres psql -d taskdb -f "$PWD/init.sql"

echo "Встановлення залежностей проєкту (npm install)..."
npm install

echo "Налаштування Nginx..."

sudo bash -c 'cat > /etc/nginx/sites-available/tasktracker <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/tasktracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "Встановлення та налаштування завершено успішно!"