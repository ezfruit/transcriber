
import { Routes, Route, Link } from 'react-router-dom';
import Login from './login';
import Signup from './signup';
import './home.css';

function Home() {
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
      <Route path="/" element={<Home/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/signup" element={<Signup/>} />
    </Routes>
  );
}

export default App;
