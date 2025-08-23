import ReactDOM from 'react-dom/client';
import './index.css';
import App from './homepage';
import { BrowserRouter as Router } from 'react-router-dom';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <Router>
        <App />
    </Router>
);
