import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './history.css'

function History() {

    const navigate = useNavigate();

    const [transcripts, setTranscripts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:5000/check", {
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

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const response = await fetch("http://localhost:5000/get-transcripts", {
                    method: "GET",
                    credentials: "include",
                });
                const data = await response.json();
                console.log(data);
                
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

    const deleteTranscript = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/delete-transcript/${id}`, {
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

    if (loading) {
        return (
        <div>
            <h2>Transcript History</h2> 
            <div> 
                Loading transcripts...
            </div>
        </div>
        );
    }

    return (
        <div>
            <h2>Transcript History</h2>
            {transcripts.length === 0 ? (
                <p>No transcripts yet.</p>
            ) : (
                <ul>
                {transcripts.map((t) => (
                    <li key={t.id} style={{ marginBottom: "1rem", position: "relative" }}>
                    <div>
                        <button className="delete-button" onClick={() => deleteTranscript(t.id)}> X </button>
                        <div>
                            <strong>{new Date(t.created_at).toLocaleString()}</strong>
                        </div>
                        <div>
                            {t.text}
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