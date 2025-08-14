import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Layout({ children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="page-container">
      {/* Navigation Header */}
      <header className="nav-header">
        <div className="container">
          <nav className="nav-content">
            {/* Logo/Brand */}
            <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
              🍽️ FoodShare
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>

            {/* Navigation Links */}
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
              {user ? (
                <>
                  <span className="nav-welcome">
                    Hey, {user.first_name}! 👋
                  </span>
                  <Link 
                    to="/dashboard" 
                    className="btn btn-success" 
                    style={{ padding: '10px 20px', fontSize: '14px' }}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="btn btn-danger"
                    style={{ padding: '10px 20px', fontSize: '14px' }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="btn btn-primary" 
                    style={{ padding: '10px 20px', fontSize: '14px' }}
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn btn-secondary" 
                    style={{ padding: '10px 20px', fontSize: '14px' }}
                    onClick={closeMobileMenu}
                  >
                    Join Us
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>Made with ❤️ for reducing food waste • © 2025 FoodShare Platform</p>
          <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', marginTop: '8px', opacity: '0.7' }}>
            Connecting communities, one meal at a time 🌱
          </p>
        </div>
      </footer>

      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-menu-toggle {
            display: block !important;
          }
          
          .nav-links {
            position: fixed;
            top: 100%;
            left: 0;
            width: 100%;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding: 20px;
            flex-direction: column;
            align-items: center;
            gap: 16px;
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          
          .nav-links.mobile-menu-open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }
          
          .nav-links .btn {
            width: 100%;
            max-width: 200px;
            justify-content: center;
          }
          
          .nav-welcome {
            text-align: center;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
