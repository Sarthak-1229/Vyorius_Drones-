import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let res;
    if (isLogin) {
      res = await login(identifier, password);
    } else {
      res = await register(username, email, password);
    }
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Vyorius <span>Drones</span></h1>
        <h2 className="auth-subtitle">{isLogin ? 'System Login' : 'Create Operator Account'}</h2>
        
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {isLogin ? (
            <div className="form-group">
              <label>Email or Operator ID</label>
              <input 
                type="text" 
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="auth-input"
                placeholder="Enter email or username"
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label>Operator ID (Username)</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="auth-input"
                  placeholder="Enter unique username"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Passcode</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              placeholder="Enter password"
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit">
            {isLogin ? 'ACCESS BOARD' : 'REGISTER'}
          </button>
        </form>

        <div className="auth-toggle-container">
          <span className="auth-toggle-text">
            {isLogin ? "Unregistered operator?" : "Already verified?"}
          </span>
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="toggle-btn">
            {isLogin ? 'Request Access' : 'Authenticate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
