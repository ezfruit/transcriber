# Easy Transcribe
Welcome to Easy Transcribe! A simple website that allows users to record and generate their own transcripts saved to their accounts.

---

**Live Demo:** [https://easy-transcribe.onrender.com/](https://easy-transcribe.onrender.com/)

---

## Tech Stack
- **Frontend:** React (Create React App)
- **Backend:** Flask (Python)
- **Database:** SQLite
- **Authentication:** JSON Web Tokens (JWT)
- **Transcription API:** Hugging Face Whisper large v3 model

## Running Locally (Development)

By default, the project is set up for production (deployed with Render).  
To run locally, follow the following steps:

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/transcriber.git
   ```
   You may need to ```cd transcriber``` if you are not inside the repository. This will be your root directory.
   
2. In the file server.py, hit Ctrl+F (Windows) or Command+F (Mac) and search up "DEV", all lines that needs to be changed will appear.
3. Uncomment all of the above said lines.
4. Ensure you are in the root directory. Then create a Python virtual environment:
    ```bash
    python -m venv venv
    ```
    Activate it:
    ### Windows:
    ```bash
    venv\Scripts\activate
    ```
    ### macOS/Linux:
    ```bash
    source venv/bin/activate
    ```
5. Install all backend dependencies.
    ```bash
    pip install -r requirements.txt
    ```
6. Create a .env file in the root directory with the following content:
    ```
    HF_API_KEY=your_huggingface_api_key_here
    ```
    Replace ```your_huggingface_api_key_here``` with your Hugging Face API key.

7. Install all frontend dependencies.

   From the root directory, run the following commands:

   ```bash
   cd client
   npm install
   ```
8. Create another .env file in the client folder (NOT root directory) with the following content:

   ```
   REACT_APP_API_BASE_URL=http://localhost:5000
   ```

9. Start the backend by running the following commands from the client directory.

   ```
   cd ..
   python server.py
   ```

10. In a separate terminal, start the frontend by running the following commands from the root directory.

     ```
     cd client
     npm start
     ```

     This will open your React app at [http://localhost:3000](http://localhost:3000).

