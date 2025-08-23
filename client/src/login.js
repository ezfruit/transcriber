import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css'
import { API_BASE_URL } from './index'

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [errorMessage, setErrorMessage] = useState("");

    // This will get run after each instance of the page is refreshed/reloaded to ensure user is redirected back to the landing page if already authenticated
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/check`, {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    navigate("/home")
                }
            } catch (error) {
                console.error("Error fetching user:", error);
            }
        };
        fetchUser();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
    };

    // This will be run when the user clicks on the "Log In" button
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: "include",
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/home');
            } else {
                setErrorMessage(data.error);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2 className="title">Welcome back!</h2>
                <form onSubmit={handleSubmit} className="login-form">
                    <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="underline-input"
                    />
                    <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="underline-input"
                    />
                    <button type="submit" className="login-button">Log In</button>
                </form>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <p className="link-to-signup">Don't have an account? Sign up <Link to="/signup" className="hyperlink">here.</Link></p>
            </div>
        </div>
    );
}

export default Login;