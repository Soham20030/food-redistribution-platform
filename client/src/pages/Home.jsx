import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="content-wrapper">
      <div className="container">
        {/* Hero Section */}
        <div className="text-center mb-5">
          <h1 className="heading-1">
            Turn Food Waste Into Hope
          </h1>
          <p className="text-muted" style={{ fontSize: '20px', maxWidth: '700px', margin: '0 auto', lineHeight: '1.7' }}>
            Connect restaurants with surplus food to organizations helping people in need. 
            Every meal saved is a step towards a better world.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="feature-grid">
          
          {/* For Restaurants */}
          <div className="feature-card">
            <span className="feature-icon">🏪</span>
            <h3 className="heading-3">For Restaurants</h3>
            <p className="text-muted mb-4">
              Transform your surplus food into community impact. Easy listing, 
              instant notifications, and meaningful connections.
            </p>
            <ul className="feature-list">
              <li>Quick food listing creation</li>
              <li>Real-time claim notifications</li>
              <li>Impact tracking & analytics</li>
              <li>Tax benefit documentation</li>
            </ul>
          </div>

          {/* For Organizations */}
          <div className="feature-card">
            <span className="feature-icon">🏢</span>
            <h3 className="heading-3">For Organizations</h3>
            <p className="text-muted mb-4">
              Food banks, shelters, and charities can discover and claim 
              fresh food donations from local restaurants.
            </p>
            <ul className="feature-list">
              <li>Smart food discovery system</li>
              <li>One-click claiming process</li>
              <li>Pickup coordination tools</li>
              <li>Expanded serving capacity</li>
            </ul>
          </div>

          {/* For Volunteers */}
          <div className="feature-card">
            <span className="feature-icon">🤝</span>
            <h3 className="heading-3">For Volunteers</h3>
            <p className="text-muted mb-4">
              Be the bridge between surplus and need. Help deliver food 
              and make a direct impact in your community.
            </p>
            <ul className="feature-list">
              <li>Flexible opportunity matching</li>
              <li>Easy pickup & delivery coordination</li>
              <li>Personal impact dashboard</li>
              <li>Community recognition system</li>
            </ul>
          </div>
        </div>

        {/* Stats Section */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h3 className="heading-3" style={{ marginBottom: '32px' }}>Making a Real Difference</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '8px' }}>1,247</div>
              <div className="text-muted">Meals Rescued</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f5576c', marginBottom: '8px' }}>89</div>
              <div className="text-muted">Partner Restaurants</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4facfe', marginBottom: '8px' }}>156</div>
              <div className="text-muted">Active Volunteers</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          {!isAuthenticated ? (
            <div>
              <h3 className="heading-3" style={{ marginBottom: '16px' }}>Ready to Make an Impact?</h3>
              <p className="text-muted mb-4">Join our community and start making a difference today.</p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                  Get Started Now
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="heading-3" style={{ marginBottom: '16px' }}>Welcome Back!</h3>
              <p className="text-muted mb-4">Ready to continue making a difference?</p>
              <Link to="/dashboard" className="btn btn-success" style={{ textDecoration: 'none' }}>
                Go to Your Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
