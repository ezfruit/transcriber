from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)
CORS(app)

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = dict_factory
    return conn

def init_db():
    conn = db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 username TEXT NOT NULL UNIQUE,
                 email TEXT NOT NULL UNIQUE,
                 password TEXT NOT NULL)''')
    conn.commit()
    conn.close()

@app.route("/")
def home():
    return render_template("index.html")
    
@app.route("/login", methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Missing fields"}), 400
        
        conn = db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        conn.close()

        if user and check_password_hash(user["password"], password):
            return jsonify({"message": "Successfully logged in"}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401
    except Exception:
        return jsonify({"error": "An unexpected error occurred"}), 500

@app.route("/signup", methods=['POST'])
def signup():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({"error": "Missing fields"}), 400
        
        hashed_pw = generate_password_hash(password)

        conn = db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            (username, email, hashed_pw)
        )
        conn.commit()
        conn.close()

        return jsonify({"message": "User successfully created an account!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or email already exists!"}), 409
    except sqlite3.Error:
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    init_db()
    app.run(debug=True) # TODO: Remember to change debug=False or just do app.run() when finishing the project