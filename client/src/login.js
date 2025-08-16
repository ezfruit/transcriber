import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css'

function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:5000/check", {
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
        
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
                credentials: "include",
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                navigate('/home');
            } else {
                setFormData({username: "", password: ""})
                setErrorMessage(data.error);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <h2>Welcome Back!</h2>
            <form onSubmit={handleSubmit} className="login-form">
                <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                />
                <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                />
                <button type="submit">Log In</button>
            </form>
            <br />
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            Don't have an account? Sign up <Link to="/signup" className="hyperlink">here.</Link>
        </div>
    );
}

export default Login;