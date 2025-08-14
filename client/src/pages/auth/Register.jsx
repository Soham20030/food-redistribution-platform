import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'restaurant',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleDescriptions = {
    restaurant: { icon: '🏪', title: 'Restaurant Owner', desc: 'I have surplus food to share' },
    organization: { icon: '🏢', title: 'Organization', desc: 'I help people in need' },
    volunteer: { icon: '🤝', title: 'Volunteer', desc: 'I want to help deliver food' }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await api.register(registrationData);
      login(response.user, response.token);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="container">
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="heading-2">Join Our Community</h1>
            <p className="text-muted">Start making a difference in food waste reduction</p>
          </div>

          <div className="card">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label">I Am A:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {Object.entries(roleDescriptions).map(([role, info]) => (
                    <label key={role} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '16px', 
                      border: `2px solid ${formData.role === role ? '#667eea' : '#e5e7eb'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: formData.role === role ? 'rgba(102, 126, 234, 0.05)' : 'transparent'
                    }}>
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={formData.role === role}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{info.icon}</span>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{info.title}</div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>{info.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Personal Information */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create a password"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginBottom: '24px' }}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create My Account'}
              </button>
            </form>

            <div className="text-center">
              <p className="text-muted">
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
