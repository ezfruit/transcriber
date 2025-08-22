import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import './landingpage.css'

function LandingPage() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [loading, setLoading] = useState(true);

    const [transcription, setTranscription] = useState("");

    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false); 

    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const handleLogout = async () => {
        try {
            await fetch("/logout", { // Use http://localhost:5000/logout for development
                method: "POST",
                credentials: "include",
            });
            setUsername("");
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    }

    const handleClick = async () => {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                
                chunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (error) {
                console.error("Error accessing microphone:", error);
            }
        } else {
            // Stop recording
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.webm");

                setIsTranscribing(true);

                // Send the audio to the Whisper ASR model
                try {
                    const response = await fetch("/transcribe", { // Use http://localhost:5000/transcribe for development
                        method: "POST",
                        body: formData,
                        credentials: "include",
                    });
                    const data = await response.json();
                    setTranscription(data.text);
                } catch (error) {
                    console.error("Transcription failed:", error);
                    setTranscription("Error transcribing audio.");
                } finally {
                    setIsTranscribing(false); // done transcribing
                }
            };
            setIsRecording(false);
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("/check", { // Use http://localhost:5000/check for development
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();
                if (response.ok) {
                    setUsername(data.username);
                } else {
                    navigate("/login"); // If user is not logged in, send them to the login page
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    if (loading) {
        return (
        <div>
            <div className="loading-message"> 
                Loading...
            </div>
        </div>
        );
    }

    return (
        <div className="landingpage">
            <div className="welcome">
                <h1>Hello, {username}!</h1>
            </div>
            <div className="dashboard-buttons">
                <Link to="/history" className={`transcript-history-button ${isRecording ? "disabled" : ""}`}>Transcript History</Link>
                <button onClick={handleLogout} className={`logout-button ${isRecording ? "disabled" : ""}`}>Log out</button>
            </div>
            <br />
            <div className="transcript-buttons">
                <button onClick={handleClick} className={`recording-button ${isRecording ? "stop-recording" : ""}`}>{isRecording ? "Stop Recording" : "Add Recording"}</button>
            </div>
            <div className="transcript">
                {isRecording ? (
                    <span className="recording-message">Recording...</span>
                ) : isTranscribing ? (
                    <span className="loading-message">Transcribing audio, please wait...</span>
                ) : transcription?.trim() ? (
                    <span className="transcription">{transcription}</span>
                ) : (
                    <span className="empty-message">
                    Click on the "Add Recording" button to start adding your transcripts!
                    </span>
                )}
            </div>
            <br />
        </div>
    );
}

export default LandingPage;