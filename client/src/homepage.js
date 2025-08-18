import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import './homepage.css'

function HomePage() {

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
            await fetch("http://localhost:5000/logout", {
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
                console.log("Recording finished:", audioBlob);

                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

                const formData = new FormData();
                formData.append("audio", audioBlob, "recording.webm");

                setIsTranscribing(true);

                // Send the audio to the Whisper ASR model
                try {
                    const response = await fetch("http://localhost:5000/transcribe", {
                        method: "POST",
                        body: formData,
                        credentials: "include",
                    });
                    const data = await response.json();
                    console.log("Transcription:", data.text);
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
                const response = await fetch("http://localhost:5000/check", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();
                console.log(data);
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
            <div> 
                Loading...
            </div>
        </div>
        );
    }

    return (
        <div className="homepage">
            <div className="welcome">
                <h1>Hello, {username}!</h1>
            </div>
            <div className="transcript-buttons">
                <button onClick={handleClick}>{isRecording ? "Stop Recording" : "Add Recording"}</button>
            </div>
            <button onClick={handleLogout} className="logout-button">Logout</button>
            <br />
            <div className="transcript">
                {isTranscribing ? (
                    <span className="loading-message">Transcribing audio, please wait...</span>
                ) : transcription?.trim() ? (
                    <span>{transcription}</span>
                ) : (
                    <span className="empty-message">
                    Click on the Add Recording button to start adding your transcripts!
                    </span>
                )}
            </div>
            <br />
            <Link to="/history" className="transcript-history-button">Transcript History</Link>
        </div>
    );
}

export default HomePage;