from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import jwt
from datetime import datetime, timedelta, timezone
import secrets

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

app.config["SECRET_KEY"] = secrets.token_hex(32)

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
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 username TEXT NOT NULL UNIQUE,
                 email TEXT NOT NULL UNIQUE,
                 password TEXT NOT NULL)''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS user_tokens (
                 username TEXT NOT NULL,
                 token TEXT NOT NULL)''')
    conn.commit()
    conn.close()

@app.route("/")
def home():
    return "Hello, World!"

@app.route("/logout", methods=['POST'])
def logout():
    conn = None
    try:
        auth_token = request.cookies.get("authToken")
        if auth_token:
            conn = db_connection()
            cur = conn.cursor()
            cur.execute("DELETE FROM user_tokens WHERE token = ?", (auth_token,))
            conn.commit()
        response = make_response(jsonify({"message": "Successfully logged out"}))
        response.set_cookie("authToken", "", httponly=True, secure=False, samesite="Lax", max_age=0)
        return response
    except Exception:
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/check", methods=['GET'])
def check():
    conn = None
    try:
        auth_token = request.cookies.get("authToken")

        # Deny access if the user doesn't have an auth token cookie
        if not auth_token:
            print("No cookie")
            return jsonify({"error": "Unauthorized access. Please login."}), 401

        conn = db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM user_tokens WHERE token = ?", (auth_token,))
        user = cur.fetchone()

        # If the user exists in the database, authenticate the user
        if user:
            return jsonify({"message": "Successfully logged in!", "username": user["username"]}), 200
        else:
            return jsonify({"error": "Invalid or expired token"}), 401
    except Exception:
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if conn:
            conn.close()
    
@app.route("/login", methods=['POST'])
def login():
    conn = None
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"error": "Missing fields"}), 400
        
        conn = db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cur.fetchone()

        # Check if the user exists in the database and the hashed password is the same as one in the database
        if user and check_password_hash(user["password"], password):

            auth_token = jwt.encode({"username": username, "exp": (datetime.now(timezone.utc) + timedelta(hours=1)).timestamp()},
                                    app.config["SECRET_KEY"], algorithm="HS256")
            
            cur.execute("INSERT INTO user_tokens (username, token) VALUES (?, ?)", (username, auth_token))
            conn.commit()

            response = make_response(jsonify({"message": "Successfully logged in!"}))
            response.set_cookie("authToken", auth_token, httponly=True, secure=False, samesite="Lax", max_age=3600)

            return response
        return jsonify({"error": "Invalid username or password!"}), 401
    except Exception:
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/signup", methods=['POST'])
def signup():
    conn = None
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({"error": "Missing fields!"}), 400
        
        hashed_pw = generate_password_hash(password)

        conn = db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            (username, email, hashed_pw)
        )
        conn.commit()

        return jsonify({"message": "User successfully created an account!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or email already exists!"}), 409
    except sqlite3.Error:
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    init_db()
    app.run(debug=True) # TODO: Remember to change debug=False or just do app.run() when finishing the project