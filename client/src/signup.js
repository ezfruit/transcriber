import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './signup.css'
import { API_BASE_URL } from './index'

function Signup() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const [errorMessage, setErrorMessage] = useState("");

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { username, password } = formData;

        if (username.length < 3 || username.length > 20) {
            setErrorMessage("Username must be between 3-20 characters long.");
            return;
        }
        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters long.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/login');
            } else {
                setErrorMessage(data.error);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-container">
                <h2 className="title">Create an Account</h2>
                <form onSubmit={handleSubmit} className="signup-form">
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
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
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
                    <button type="submit" className="signup-button">Sign Up</button>
                </form>
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <p className="link-to-login">Already have an account? Log in <Link to="/login" className="hyperlink">here.</Link></p>
            </div>
        </div>
    );
}

export default Signup;