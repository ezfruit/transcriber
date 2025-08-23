import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './history.css'
import { API_BASE_URL } from './index'

function History() {

    const navigate = useNavigate();

    const [transcripts, setTranscripts] = useState([]);
    const [loading, setLoading] = useState(true);

    // This will get run after each instance of the page is refreshed/reloaded to ensure user is authenticated
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/check`, {
                    method: "GET",
                    credentials: "include",
                });
    
                if (!response.ok) {
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

    // This will get run after each instance of the page is refreshed/reloaded to load the transcripts from the database
    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/get-transcripts`, { 
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();
                
                if (response.ok) {
                    setTranscripts(data);
                } else {
                    console.error("Failed to fetch transcripts:", data);
                }
            } catch (error) {
                console.error("Error fetching transcripts:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTranscripts();
    }, []);

    // This will get run when the X button is clicked to delete the transcript based on their id and delete it from the server
    const deleteTranscript = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/delete-transcript/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await response.json();
            if (response.ok) {
                setTranscripts(transcripts.filter((t) => t.id !== id));
            } else {
                console.error(data.error);
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    // Loading message when the backend has not responded back
    if (loading) {
        return (
        <div> 
            <div className="loading-message"> 
                Loading transcripts...
            </div>
        </div>
        );
    }

    return (
        <div>
            <h2 className="history-title">Transcript History</h2>
            <div className="back-button-wrapper">
                <Link to="/home" className="back-button">Back</Link>
            </div>
            {transcripts.length === 0 ? (
                <p className="empty">No transcripts yet.</p>
            ) : (
                <ul className="list">
                {transcripts.map((t) => (
                    <li key={t.id} style={{ marginBottom: "1rem" }}>
                        <div className="transcript-item">
                            <button className="delete-button" onClick={() => deleteTranscript(t.id)}>X</button>
                            <div className="transcript-content">
                                <strong>{new Date(t.created_at + "Z").toLocaleString("en-US", { timeZone: "America/New_York" })}</strong>
                                <div>{t.text}</div>
                            </div>
                        </div>
                    </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default History