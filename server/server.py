from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
    return render_template("index.html")
    
@app.route("/login", methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    print(username, password)
    return jsonify({"message": "Successfully logged in"}), 201

@app.route("/signup", methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    print(username, email, password)
    return jsonify({"message": "Successfully created an account"}), 201

if __name__ == "__main__":
    app.run(debug=True)