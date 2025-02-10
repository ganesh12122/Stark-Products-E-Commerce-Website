from flask import Flask, request, jsonify, session, redirect, url_for, flash, render_template
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime
from functools import wraps
from flask_cors import CORS
from dotenv import load_dotenv
import stripe
import razorpay

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

# CORS configuration
CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Database configuration
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')
mysql = MySQL(app)

# Initialize payment clients
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_KEY_SECRET')))

# Admin middleware
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

# Public routes
@app.route('/')
def home():
    return jsonify({"message": "Welcome to Stark Products API"})

@app.route('/api/products/category/<category_name>')
def category_products(category_name):
    cur = mysql.connection.cursor()
    cur.execute('''SELECT p.*, c.name as category_name 
                   FROM products p 
                   JOIN categories c ON p.category_id = c.id 
                   WHERE c.name = %s''', (category_name,))
    products = cur.fetchall()
    cur.close()
    
    return jsonify([{
        'id': p[0],
        'name': p[1],
        'description': p[2],
        'price': float(p[3]),
        'image_url': p[4],
        'stock': p[5],
        'category': p[8]
    } for p in products])

@app.route('/api/products/<int:product_id>')
def get_product(product_id):
    cur = mysql.connection.cursor()
    cur.execute('SELECT p.*, c.name as category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = %s', (product_id,))
    product = cur.fetchone()
    cur.close()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
        
    return jsonify({
        'id': product[0],
        'name': product[1],
        'description': product[2],
        'price': float(product[3]),
        'image_url': product[4],
        'stock': product[5],
        'category': product[8]
    })

@app.route('/cart')
def cart():
    return render_template('cart.html')

# Admin routes

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    cur = mysql.connection.cursor()
    cur.execute('SELECT * FROM admins WHERE username = %s', (username,))
    admin = cur.fetchone()
    cur.close()
    
    if admin and check_password_hash(admin[2], password):
        session['admin_logged_in'] = True
        return jsonify({'message': 'Login successful'})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/admin')
@admin_required
def admin_dashboard():
    return render_template('admin/dashboard.html')

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.pop('admin_logged_in', None)
    return jsonify({'message': 'Logged out successfully'})

@app.route('/admin/products')
@admin_required
def admin_products():
    cur = mysql.connection.cursor()
    cur.execute('''SELECT p.*, c.name as category_name 
                   FROM products p 
                   JOIN categories c ON p.category_id = c.id''')
    products = cur.fetchall()
    cur.close()
    
    return render_template('admin/products.html', products=[{
        'id': p[0],
        'name': p[1],
        'description': p[2],
        'price': float(p[3]),
        'image_url': p[4],
        'stock': p[5],
        'category': p[8]
    } for p in products])

@app.route('/admin/categories', methods=['GET', 'POST'])
@admin_required
def admin_categories():
    if request.method == 'POST':
        name = request.form.get('name')
        cur = mysql.connection.cursor()
        cur.execute('INSERT INTO categories (name) VALUES (%s)', (name,))
        mysql.connection.commit()
        cur.close()
        return jsonify({'message': 'Category added successfully'})
    
    categories = db_query('SELECT * FROM categories')
    if categories is None:
        return jsonify({'error': 'Database error'}), 500
    
    return jsonify([{
        'id': c[0],
        'name': c[1]
    } for c in categories])

@app.route('/admin/orders')
@admin_required
def admin_orders():
    orders = db_query('''SELECT o.*, u.email as user_email 
                        FROM orders o 
                        JOIN users u ON o.user_id = u.id 
                        ORDER BY o.created_at DESC''')
    if orders is None:
        return jsonify({'error': 'Database error'}), 500
    
    return jsonify([{
        'id': o[0],
        'user_email': o[6],
        'total': float(o[2]),
        'status': o[3],
        'created_at': o[4]
    } for o in orders])

# API routes
@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search')
    
    cur = mysql.connection.cursor()
    
    if category:
        cur.execute('''SELECT p.*, c.name as category_name 
                       FROM products p 
                       JOIN categories c ON p.category_id = c.id 
                       WHERE c.name = %s''', (category,))
    elif search:
        cur.execute('''SELECT p.*, c.name as category_name 
                       FROM products p 
                       JOIN categories c ON p.category_id = c.id 
                       WHERE p.name LIKE %s OR p.description LIKE %s''', 
                    (f'%{search}%', f'%{search}%'))
    else:
        cur.execute('''SELECT p.*, c.name as category_name 
                       FROM products p 
                       JOIN categories c ON p.category_id = c.id''')
    
    products = cur.fetchall()
    cur.close()
    
    return jsonify([{
        'id': p[0],
        'name': p[1],
        'description': p[2],
        'price': float(p[3]),
        'image_url': p[4],
        'stock': p[5],
        'category': p[8]
    } for p in products])

@app.route('/api/products', methods=['POST'])
@admin_required
def add_product():
    try:
        data = request.json
        required_fields = ['name', 'description', 'price', 'image_url', 'stock', 'category_id']
        if not all(k in data for k in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        cur = mysql.connection.cursor()
        cur.execute('''INSERT INTO products 
                      (name, description, price, image_url, stock, category_id) 
                      VALUES (%s, %s, %s, %s, %s, %s)''',
                   (data['name'], data['description'], data['price'],
                    data['image_url'], data['stock'], data['category_id']))
        mysql.connection.commit()
        cur.close()
        
        return jsonify({'message': 'Product added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    data = request.json
    cur = mysql.connection.cursor()
    cur.execute('''UPDATE products 
                   SET name = %s, description = %s, price = %s, 
                       image_url = %s, stock = %s, category_id = %s 
                   WHERE id = %s''',
                (data['name'], data['description'], data['price'],
                 data['image_url'], data['stock'], data['category_id'], product_id))
    mysql.connection.commit()
    cur.close()
    
    return jsonify({'message': 'Product updated successfully'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    cur = mysql.connection.cursor()
    cur.execute('DELETE FROM products WHERE id = %s', (product_id,))
    mysql.connection.commit()
    cur.close()
    
    return jsonify({'message': 'Product deleted successfully'})

@app.route('/api/products/featured', methods=['GET'])
def get_featured_products():
    cur = mysql.connection.cursor()
    cur.execute('''SELECT id, name, price, image_url, description
                   FROM products
                   WHERE featured = 1''')
    products = cur.fetchall()
    cur.close()
    return jsonify(products)

def db_query(query, params=None):
    try:
        cur = mysql.connection.cursor()
        cur.execute(query, params or ())
        result = cur.fetchall()
        cur.close()
        return result
    except Exception as e:
        print(f"Database error: {str(e)}")
        return None

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = db_query('SELECT id, name FROM categories')
    if categories is None:
        return jsonify({'error': 'Database error'}), 500
    
    return jsonify([{
        'id': c[0],
        'name': c[1]
    } for c in categories])

# Payment routes
@app.route('/api/payment/initialize', methods=['POST'])
def initialize_payment():
    try:
        data = request.json
        if not all(k in data for k in ['orderId', 'amount', 'method']):
            return jsonify({'error': 'Missing required fields'}), 400

        order_id = data['orderId']
        amount = data['amount']
        method = data['method']

        if method not in ['card', 'upi', 'cod']:
            return jsonify({'error': 'Invalid payment method'}), 400

        if method == 'card':
            # Create Stripe payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Convert to cents
                currency='usd'
            )
            return jsonify({
                'clientSecret': intent.client_secret
            })
            
        elif method == 'upi':
            # Create Razorpay order
            order = razorpay_client.order.create({
                'amount': int(amount * 100),
                'currency': 'INR',
                'payment_capture': 1
            })
            return jsonify(order)
            
        elif method == 'cod':
            # Create COD order
            cur = mysql.connection.cursor()
            cur.execute('''UPDATE orders 
                          SET payment_method = 'cod', payment_status = 'pending' 
                          WHERE id = %s''', (order_id,))
            mysql.connection.commit()
            cur.close()
            return jsonify({'success': True})
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/payment/verify-upi', methods=['POST'])
def verify_upi_payment():
    data = request.json
    transaction_id = data['transactionId']
    
    try:
        # Verify payment with Razorpay
        payment = razorpay_client.payment.fetch(transaction_id)
        if payment['status'] == 'captured':
            return jsonify({'success': True})
        return jsonify({'success': False}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    # Implement logic to fetch and return admin stats
    return jsonify({'totalProducts': 100, 'totalOrders': 50, 'totalRevenue': 5000, 'lowStock': 5})

@app.route('/api/admin/products/recent', methods=['GET'])
@admin_required
def get_recent_products():
    # Implement logic to fetch and return recent products
    return jsonify([{'id': 1, 'name': 'Product 1', 'price': 100, 'stock': 10, 'category': 'Category 1'}])

@app.route('/api/admin/check-auth', methods=['GET'])
def check_auth():
    if 'admin_logged_in' in session:
        return jsonify({'isAuthenticated': True})
    return jsonify({'isAuthenticated': False})

@app.route('/api/user/login', methods=['POST'])
def user_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    cur = mysql.connection.cursor()
    cur.execute('SELECT * FROM users WHERE email = %s', (email,))
    user = cur.fetchone()
    cur.close()
    
    if user and check_password_hash(user[2], password):
        session['user_logged_in'] = True
        return jsonify({'message': 'Login successful'})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/user/signup', methods=['POST'])
def user_signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # Hash the password
    password_hash = generate_password_hash(password)
    
    cur = mysql.connection.cursor()
    try:
        cur.execute('INSERT INTO users (email, password_hash) VALUES (%s, %s)', (email, password_hash))
        mysql.connection.commit()
        return jsonify({'message': 'Signup successful'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        cur.close()

if __name__ == '__main__':
    app.run(debug=True)