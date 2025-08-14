import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

function VolunteerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      let dashData = null;
      let oppsData = null;  
      let assignData = null;

      try {
        dashData = await api.get('/dashboard/volunteer');
      } catch (error) {
        console.error('Dashboard API failed:', error);
        dashData = { dashboard: { total_hours: 0, completed_assignments: 0, upcoming_assignments: 0, organizations_helped: 0 } };
      }

      try {
        oppsData = await api.get('/volunteers/opportunities');
      } catch (error) {
        console.error('Opportunities API failed:', error);
        oppsData = { opportunities: [] };
      }

      try {
        assignData = await api.get('/volunteers/my-assignments');
      } catch (error) {
        console.error('Assignments API failed:', error);
        assignData = { assignments: [] };
      }

      setDashboardData(dashData.dashboard);
      setOpportunities(oppsData.opportunities || []);
      setAssignments(assignData.assignments || []);
      
    } catch (error) {
      console.error('Error loading volunteer dashboard data:', error);
      setDashboardData({ total_hours: 0, completed_assignments: 0, upcoming_assignments: 0, organizations_helped: 0 });
      setOpportunities([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'opportunities', label: 'Opportunities', icon: '🔍' },
    { id: 'assignments', label: 'Assignments', icon: '🗂️' },
    { id: 'profile', label: 'Profile', icon: '🤝' }
  ];

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="container text-center">
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Loading your volunteer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="container">
        {/* Header */}
        <div className="mb-5">
          <h1 className="heading-2">🤝 Volunteer Dashboard</h1>
          <p className="text-muted">
            Hello {user.first_name}! Ready to make a difference through volunteering?
          </p>
        </div>

        {/* Mobile-Responsive Tab Navigation */}
        <div className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab data={dashboardData} />}
        {activeTab === 'opportunities' && <OpportunitiesTab opportunities={opportunities} onRefresh={loadDashboardData} />}
        {activeTab === 'assignments' && <AssignmentsTab assignments={assignments} onRefresh={loadDashboardData} />}
        {activeTab === 'profile' && <VolunteerProfileTab onRefresh={loadDashboardData} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }) {
  if (!data) {
    return <div className="card"><p>Loading statistics...</p></div>;
  }

  const stats = [
    { label: 'Total Hours Volunteered', value: data.total_hours || 0, icon: '⏰', color: '#667eea' },
    { label: 'Completed Assignments', value: data.completed_assignments || 0, icon: '✅', color: '#10b981' },
    { label: 'Upcoming Assignments', value: data.upcoming_assignments || 0, icon: '📅', color: '#f5576c' },
    { label: 'Organizations Helped', value: data.organizations_helped || 0, icon: '🤝', color: '#4facfe' }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="feature-grid" style={{ marginBottom: '32px' }}>
        {stats.map((stat, index) => (
          <div key={index} className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{stat.icon}</div>
            <div style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: stat.color,
              marginBottom: '8px'
            }}>
              {stat.value}
            </div>
            <div className="text-muted" style={{ fontSize: '14px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Welcome Message */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Welcome to Volunteering!</h3>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🌟</div>
          <p style={{ fontSize: '18px', marginBottom: '20px', color: '#374151' }}>
            Thank you for joining our mission to reduce food waste and help those in need!
          </p>
          <div className="feature-grid">
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontWeight: '500', color: '#667eea', fontSize: '14px' }}>Browse Opportunities</div>
            </div>
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📋</div>
              <div style={{ fontWeight: '500', color: '#10b981', fontSize: '14px' }}>Track Assignments</div>
            </div>
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(250, 112, 154, 0.05) 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🤝</div>
              <div style={{ fontWeight: '500', color: '#f5576c', fontSize: '14px' }}>Make Impact</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Opportunities Tab Component
function OpportunitiesTab({ opportunities, onRefresh }) {
  const [signingUp, setSigningUp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (claimId) => {
    setSigningUp(claimId);
    setLoading(true);
    setError('');
    try {
      await api.post(`/volunteers/signup/${claimId}`);
      onRefresh();
    } catch (error) {
      setError(error.message || 'Failed to sign up for opportunity');
    } finally {
      setLoading(false);
      setSigningUp(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <h3 className="heading-3" style={{ marginBottom: '24px' }}>Available Volunteer Opportunities</h3>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {opportunities.length === 0 ? (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤷‍♂️</div>
          <h3 style={{ marginBottom: '12px' }}>No volunteer opportunities available</h3>
          <p className="text-muted">
            Opportunities appear when organizations claim food and need help with pickup/delivery. 
            Check back later for new assignments!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {opportunities.map((op) => (
            <div key={op.claim_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{op.food_title}</h4>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    From <strong>{op.restaurant_name}</strong> → <strong>{op.organization_name}</strong>
                  </p>
                </div>

                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: '#d1fae5',
                  color: '#065f46'
                }}>
                  Help Needed
                </span>
              </div>

              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Quantity:</span>
                  <span>{op.claimed_quantity} servings</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Pickup Time:</span>
                  <span>{formatDate(op.pickup_scheduled_time)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Pickup Address:</span>
                  <span>{op.restaurant_address}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Restaurant Phone:</span>
                  <span>{op.restaurant_phone}</span>
                </div>
              </div>

              {op.notes && (
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(102, 126, 234, 0.05)', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Organization Notes:
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{op.notes}</div>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={() => handleSignUp(op.claim_id)}
                disabled={signingUp === op.claim_id}
                style={{ width: '100%' }}
              >
                {signingUp === op.claim_id ? 'Signing Up...' : '🤝 Volunteer for This Pickup'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Assignments Tab Component
function AssignmentsTab({ assignments, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleComplete = async (assignmentId) => {
    setLoading(true);
    setError('');
    try {
      await api.put(`/volunteers/assignments/${assignmentId}/complete`);
      onRefresh();
    } catch (error) {
      setError(error.message || 'Failed to mark assignment as complete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="heading-3" style={{ marginBottom: '24px' }}>My Volunteer Assignments</h3>

      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}

      {assignments.length === 0 ? (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
          <h3 style={{ marginBottom: '12px' }}>No current assignments</h3>
          <p className="text-muted">
            Browse available opportunities to sign up for pickup and delivery assignments.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{assignment.food_title}</h4>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    From <strong>{assignment.restaurant_name}</strong> → <strong>{assignment.organization_name}</strong>
                  </p>
                </div>

                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: assignment.status === 'assigned' ? '#fef3c7' : '#d1fae5',
                  color: assignment.status === 'assigned' ? '#92400e' : '#065f46'
                }}>
                  {assignment.status === 'assigned' ? 'Active Assignment' : 'Completed'}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Pickup Time:</span>
                  <span>{formatDate(assignment.pickup_scheduled_time)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Quantity:</span>
                  <span>{assignment.claimed_quantity} servings</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Restaurant Phone:</span>
                  <span>{assignment.restaurant_phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Pickup Address:</span>
                  <span>{assignment.restaurant_address}</span>
                </div>
              </div>

              {assignment.status === 'assigned' && (
                <button
                  className="btn btn-success"
                  onClick={() => handleComplete(assignment.id)}
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Marking Complete...' : '✅ Mark Pickup as Completed'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Volunteer Profile Tab Component
function VolunteerProfileTab({ onRefresh }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/volunteers/profile');
      setProfile(response.volunteer);
      setFormData(response.volunteer || {});
    } catch (error) {
      console.error('Error loading volunteer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/volunteers/profile', formData);
      setProfile(formData);
      setEditing(false);
      onRefresh();
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  if (loading) {
    return <div className="card"><p>Loading profile...</p></div>;
  }

  if (!profile && !editing) {
    return (
      <div className="card text-center">
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤝</div>
        <h3 style={{ marginBottom: '12px' }}>Complete Your Volunteer Profile</h3>
        <p className="text-muted mb-4">
          Set up your volunteer preferences and availability to get matched with relevant opportunities.
        </p>
        <button 
          onClick={() => setEditing(true)}
          className="btn btn-primary"
        >
          Create Volunteer Profile
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="heading-3">Volunteer Profile</h3>
        {profile && !editing && (
          <button 
            onClick={() => setEditing(true)}
            className="btn btn-secondary"
          >
            Edit Profile
          </button>
        )}
      </div>

      {editing ? (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="form-input"
                placeholder="+1 (555) 123-4567"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Availability</label>
              <textarea
                value={formData.availability || ''}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                className="form-input"
                placeholder="e.g., Weekdays 6-8 PM, Weekends all day"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transportation Method</label>
              <select
                value={formData.transportation || ''}
                onChange={(e) => setFormData({...formData, transportation: e.target.value})}
                className="form-select"
                required
              >
                <option value="">Select your transportation</option>
                <option value="car">🚗 Car</option>
                <option value="bike">🚲 Bike</option>
                <option value="public_transport">🚌 Public Transport</option>
                <option value="walking">🚶 Walking</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Special Skills or Preferences</label>
              <textarea
                value={formData.skills || ''}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                className="form-input"
                placeholder="Any special skills, dietary handling experience, or volunteer preferences..."
                rows="2"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => setEditing(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Phone:</span>
              <span>{profile.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Availability:</span>
              <span>{profile.availability}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Transportation:</span>
              <span style={{ textTransform: 'capitalize' }}>
                {profile.transportation?.replace('_', ' ')}
              </span>
            </div>
            {profile.skills && (
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: '500', color: '#374151' }}>Skills/Preferences:</span>
                <span>{profile.skills}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VolunteerDashboard;
