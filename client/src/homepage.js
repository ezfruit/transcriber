import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");

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
            }
        };
        fetchUser();
    }, [navigate]);

    return (
        <div className="homepage">
            <h1>Hello, {username}!</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default HomePage;