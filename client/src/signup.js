import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('http://localhost:5000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (response.ok) {
                navigate('/login');
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="signup-container">
            <h2>Create an Account</h2>
            <form onSubmit={handleSubmit} className="signup-form">
                <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                />
                <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
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
                <button type="submit">Sign Up</button>
            </form>
            <br />
            Already have an account? Log in <Link to="/login" className="hyperlink">here.</Link>
        </div>
    );
}

export default Signup;