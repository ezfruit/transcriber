
import { useEffect } from "react";
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import Login from './login';
import Signup from './signup';
import LandingPage from './landingpage';
import History from './history';
import './homepage.css';

function Home() {

  const navigate = useNavigate();

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

  return (
    <div className="app-container">
      <h1 className="app-title">Easy Transcribe</h1>
      <div className="login">
        <Link to="/login" className="login-button">Login</Link>
      </div>
      <br />
      <div className="signup">
        Don't have an account? Click <Link to="/signup" className="hyperlink">here</Link> to sign up.
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/signup" element={<Signup/>}/>
      <Route path="/home" element={<LandingPage/>}/>
      <Route path="/history" element={<History/>}/>
    </Routes>
  );
}

export default App;
