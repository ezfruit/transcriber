from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import jwt
from datetime import datetime, timedelta, timezone
import secrets
import torch
from transformers import pipeline
import tempfile
import subprocess
import os

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

app.config["SECRET_KEY"] = secrets.token_hex(32)

device = 0 if torch.cuda.is_available() else -1
asr_pipeline = pipeline("automatic-speech-recognition", model="openai/whisper-medium", device=device)

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
    cur.execute('''
        CREATE TABLE IF NOT EXISTS transcripts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                text TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.commit()
    conn.close()

# Get the current username if they are authenticated
def get_username(cur):

    auth_token = request.cookies.get("authToken")

    if not auth_token:
        return None

    cur.execute("SELECT * FROM user_tokens WHERE token = ?", (auth_token,))
    user = cur.fetchone()

    if user:
        return user["username"]
    return None

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
        
        # Weak username
        if not (3 <= len(username) <= 20):
            return jsonify({"error": "Username must be between 3-20 characters long"}), 400

        # Weak password
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400

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

@app.route("/transcribe", methods=['POST'])
def transcribe():

    if "audio" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400
    
    audio_file = request.files["audio"]

    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_webm:
        audio_file.save(tmp_webm.name)

    # Convert .webm to .wav
    tmp_wav_path = tmp_webm.name.replace(".webm", ".wav")
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_webm.name, tmp_wav_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "ffmpeg conversion failed", "details": e.stderr.decode()}), 500

    result = asr_pipeline(tmp_wav_path)

    # Cleanup temp files
    os.remove(tmp_webm.name)
    os.remove(tmp_wav_path)

    conn = None

    text = result["text"]

    try:
        conn = db_connection()
        cur = conn.cursor()

        username = get_username(cur)

        cur.execute("INSERT INTO transcripts (username, text) VALUES (?, ?)", (username, text))

        conn.commit()
    except Exception:
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if conn:
            conn.close()
    
    return jsonify({"text": text})

@app.route("/get-transcripts", methods=['GET'])
def get_transcripts():
    conn = None
    try:
        conn = db_connection()
        cur = conn.cursor()

        username = get_username(cur)

        cur.execute("SELECT * FROM transcripts WHERE username = ? ORDER BY created_at DESC", (username,))

        transcripts = cur.fetchall()

        return jsonify(transcripts)

    except Exception:
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/delete-transcript/<int:transcript_id>", methods=['DELETE'])
def delete_transcript(transcript_id):
    conn = None
    try:
        conn = db_connection()
        cur = conn.cursor()

        username = get_username(cur)
        if not username:
            return jsonify({"error": "Unauthorized"}), 401

        cur.execute("DELETE FROM transcripts WHERE id = ? AND username = ?", (transcript_id, username))
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"error": "Transcript not found"}), 404

        return jsonify({"success": True}), 200
    except Exception:
        return jsonify({"error": "An unexpected error occurred"}), 500
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    init_db()
    app.run(debug=True) # TODO: Remember to change debug=False or just do app.run() when finishing the project