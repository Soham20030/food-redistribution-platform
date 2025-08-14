import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

function OrganizationDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [availableFood, setAvailableFood] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    food_type: '',
    sort_by: 'created'
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, foodListings, claims] = await Promise.all([
        api.get('/dashboard/organization'),
        api.get('/food-listings/available'),
        api.get('/food-claims/my-claims')
      ]);
      
      setDashboardData(dashData.dashboard);
      setAvailableFood(foodListings.listings);
      setMyClaims(claims.claims);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'browse', label: 'Browse Food', icon: '🔍' },
    { id: 'claims', label: 'My Claims', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '🏢' }
  ];

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="container text-center">
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Loading your organization dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="container">
        {/* Header */}
        <div className="mb-5">
          <h1 className="heading-2">🏢 Organization Dashboard</h1>
          <p className="text-muted">
            Welcome {user.first_name}! Ready to find some amazing food donations today?
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
        {activeTab === 'browse' && (
          <BrowseFoodTab 
            availableFood={availableFood}
            searchFilters={searchFilters}
            setSearchFilters={setSearchFilters}
            onRefresh={loadDashboardData}
          />
        )}
        {activeTab === 'claims' && <MyClaimsTab claims={myClaims} onRefresh={loadDashboardData} />}
        {activeTab === 'profile' && <OrganizationProfileTab onRefresh={loadDashboardData} />}
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
    { label: 'Total Claims Made', value: data.total_claims, icon: '📋', color: '#667eea' },
    { label: 'Approved Claims', value: data.approved_claims, icon: '✅', color: '#10b981' },
    { label: 'Completed Pickups', value: data.completed_pickups, icon: '🚚', color: '#f5576c' },
    { label: 'Servings Received', value: data.total_servings_received, icon: '🍽️', color: '#4facfe' }
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

      {/* Upcoming Pickups */}
      {data.upcoming_pickups && data.upcoming_pickups.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Pickups</h3>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {data.upcoming_pickups.map((pickup) => (
              <div key={pickup.id} style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                borderRadius: '12px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{pickup.title}</h4>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                      {pickup.restaurant_name} • {pickup.claimed_quantity} servings
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#065f46', fontSize: '14px', fontWeight: '500' }}>
                      📅 {new Date(pickup.pickup_scheduled_time).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: '#d1fae5',
                    color: '#065f46'
                  }}>
                    Ready for pickup
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="feature-grid">
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontWeight: '500', color: '#667eea' }}>Browse Available Food</div>
          </div>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, rgba(245, 87, 108, 0.1) 0%, rgba(250, 112, 154, 0.05) 100%)',
            borderRadius: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.3s ease'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
            <div style={{ fontWeight: '500', color: '#f5576c' }}>Manage My Claims</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Browse Food Tab Component
function BrowseFoodTab({ availableFood, searchFilters, setSearchFilters, onRefresh }) {
  const [filteredFood, setFilteredFood] = useState(availableFood);
  const [claimingFood, setClaimingFood] = useState(null);

  useEffect(() => {
    applyFilters();
  }, [availableFood, searchFilters]);

  const applyFilters = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilters.search) params.append('search', searchFilters.search);
      if (searchFilters.food_type) params.append('food_type', searchFilters.food_type);
      if (searchFilters.sort_by) params.append('sort_by', searchFilters.sort_by);

      const response = await api.get(`/food-listings/available?${params.toString()}`);
      setFilteredFood(response.listings);
    } catch (error) {
      console.error('Error filtering food:', error);
    }
  };

  const handleClaim = (foodListing) => {
    setClaimingFood(foodListing);
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
      {/* Search and Filter Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">Search Food</label>
            <input
              type="text"
              value={searchFilters.search}
              onChange={(e) => setSearchFilters({...searchFilters, search: e.target.value})}
              className="form-input"
              placeholder="Search by food name, type, or restaurant..."
            />
          </div>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">Food Type</label>
            <select
              value={searchFilters.food_type}
              onChange={(e) => setSearchFilters({...searchFilters, food_type: e.target.value})}
              className="form-select"
            >
              <option value="">All Types</option>
              <option value="Italian">Italian</option>
              <option value="Mexican">Mexican</option>
              <option value="Chinese">Chinese</option>
              <option value="American">American</option>
              <option value="Indian">Indian</option>
              <option value="Bakery">Bakery</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '0' }}>
            <label className="form-label">Sort By</label>
            <select
              value={searchFilters.sort_by}
              onChange={(e) => setSearchFilters({...searchFilters, sort_by: e.target.value})}
              className="form-select"
            >
              <option value="created">Newest First</option>
              <option value="expiry">Expiry Date</option>
              <option value="quantity">Quantity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Claiming Modal */}
      {claimingFood && (
        <ClaimFoodModal 
          foodListing={claimingFood} 
          onClose={() => setClaimingFood(null)}
          onSuccess={() => {
            setClaimingFood(null);
            onRefresh();
          }}
        />
      )}

      {/* Food Listings Grid */}
      {filteredFood.length === 0 ? (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ marginBottom: '12px' }}>No food listings found</h3>
          <p className="text-muted">Try adjusting your search filters or check back later for new listings.</p>
        </div>
      ) : (
        <div className="feature-grid">
          {filteredFood.map((listing) => (
            <div key={listing.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: '0', color: '#1f2937' }}>{listing.title}</h4>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: '#d1fae5',
                  color: '#065f46'
                }}>
                  Available
                </div>
              </div>
              
              <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                {listing.description}
              </p>
              
              <div style={{ display: 'grid', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Restaurant:</span>
                  <span style={{ fontWeight: '500' }}>{listing.restaurant_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Quantity:</span>
                  <span>{listing.quantity} {listing.unit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Food Type:</span>
                  <span>{listing.food_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Pickup Window:</span>
                  <span>{formatDate(listing.pickup_time_start)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Expires:</span>
                  <span style={{ color: '#dc2626', fontWeight: '500' }}>{formatDate(listing.expiry_date)}</span>
                </div>
              </div>

              <button 
                onClick={() => handleClaim(listing)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                🍽️ Claim This Food
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <p className="text-muted">
          Found {filteredFood.length} food listing{filteredFood.length !== 1 ? 's' : ''} available for pickup
        </p>
      </div>
    </div>
  );
}

// Claim Food Modal Component
function ClaimFoodModal({ foodListing, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    claimed_quantity: foodListing.quantity,
    pickup_scheduled_time: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const claimData = {
        food_listing_id: foodListing.id,
        claimed_quantity: parseInt(formData.claimed_quantity),
        pickup_scheduled_time: new Date(formData.pickup_scheduled_time).toISOString(),
        notes: formData.notes
      };

      await api.post('/food-claims', claimData);
      onSuccess();
    } catch (error) {
      setError(error.message || 'Failed to claim food');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content card" style={{ 
        width: '100%', 
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        margin: 0
      }}>
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 className="card-title">Claim Food Listing</h3>
            <button 
              onClick={onClose}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '24px', 
                cursor: 'pointer',
                color: '#6b7280',
                minWidth: '44px',
                minHeight: '44px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Food Details */}
        <div style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{foodListing.title}</h4>
          <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
            {foodListing.restaurant_name} • {foodListing.food_type}
          </p>
          <p style={{ margin: '0', color: '#374151', fontSize: '14px' }}>
            <strong>Available:</strong> {foodListing.quantity} {foodListing.unit}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Quantity to Claim</label>
            <input
              type="number"
              value={formData.claimed_quantity}
              onChange={(e) => setFormData({...formData, claimed_quantity: e.target.value})}
              className="form-input"
              min="1"
              max={foodListing.quantity}
              required
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Maximum available: {foodListing.quantity} {foodListing.unit}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Pickup Time</label>
            <input
              type="datetime-local"
              value={formData.pickup_scheduled_time}
              onChange={(e) => setFormData({...formData, pickup_scheduled_time: e.target.value})}
              className="form-input"
              min={foodListing.pickup_time_start?.slice(0, 16)}
              max={foodListing.pickup_time_end?.slice(0, 16)}
              required
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Pickup window: {new Date(foodListing.pickup_time_start).toLocaleString()} - {new Date(foodListing.pickup_time_end).toLocaleString()}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="form-input"
              rows="3"
              placeholder="Any special requirements or notes for the restaurant..."
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Claiming...' : '🍽️ Claim Food'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// My Claims Tab Component
function MyClaimsTab({ claims, onRefresh }) {
  const handleStatusUpdate = async (claimId, status) => {
    try {
      await api.put(`/food-claims/${claimId}/status`, { status });
      onRefresh();
    } catch (error) {
      alert('Error updating claim status: ' + error.message);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'approved':
        return { bg: '#d1fae5', color: '#065f46' };
      case 'completed':
        return { bg: '#dbeafe', color: '#1e40af' };
      case 'rejected':
        return { bg: '#fee2e2', color: '#991b1b' };
      default:
        return { bg: '#e5e7eb', color: '#374151' };
    }
  };

  if (claims.length === 0) {
    return (
      <div className="card text-center">
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
        <h3 style={{ marginBottom: '12px' }}>No claims yet</h3>
        <p className="text-muted">Start browsing available food to make your first claim!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="heading-3" style={{ marginBottom: '24px' }}>My Food Claims</h3>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {claims.map((claim) => {
          const statusStyle = getStatusColor(claim.status);
          return (
            <div key={claim.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{claim.title}</h4>
                  <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                    From <strong>{claim.restaurant_name}</strong>
                  </p>
                </div>
                <span style={{
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: statusStyle.bg,
                  color: statusStyle.color
                }}>
                  {claim.status}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Quantity Claimed:</span>
                  <span>{claim.claimed_quantity} servings</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Pickup Time:</span>
                  <span>{formatDate(claim.pickup_scheduled_time)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Food Type:</span>
                  <span>{claim.food_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Restaurant Phone:</span>
                  <span>{claim.restaurant_phone}</span>
                </div>
              </div>

              {claim.notes && (
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(102, 126, 234, 0.05)', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Your Notes:
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>{claim.notes}</div>
                </div>
              )}

              {/* Action buttons based on status */}
              {claim.status === 'approved' && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleStatusUpdate(claim.id, 'completed')}
                    className="btn btn-success"
                    style={{ flex: 1, fontSize: '14px', minWidth: '140px' }}
                  >
                    ✓ Mark as Picked Up
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(claim.id, 'cancelled')}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '14px', minWidth: '140px' }}
                  >
                    Cancel Pickup
                  </button>
                </div>
              )}

              {claim.status === 'pending' && (
                <div style={{ 
                  padding: '12px', 
                  background: 'rgba(251, 191, 36, 0.1)', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>
                    ⏳ Waiting for restaurant approval
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Organization Profile Tab Component
function OrganizationProfileTab({ onRefresh }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/organizations/profile');
      setProfile(response.organization);
      setFormData(response.organization);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/organizations/profile', formData);
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
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏢</div>
        <h3 style={{ marginBottom: '12px' }}>Complete Your Organization Profile</h3>
        <p className="text-muted mb-4">
          Set up your organization information to start claiming food donations from restaurants.
        </p>
        <button 
          onClick={() => setEditing(true)}
          className="btn btn-primary"
        >
          Create Organization Profile
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="heading-3">Organization Profile</h3>
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
              <label className="form-label">Organization Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Type</label>
              <select
                value={formData.type || ''}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="form-select"
                required
              >
                <option value="">Select Type</option>
                <option value="food_bank">Food Bank</option>
                <option value="shelter">Homeless Shelter</option>
                <option value="soup_kitchen">Soup Kitchen</option>
                <option value="charity">Charity Organization</option>
                <option value="community_center">Community Center</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="form-input"
                required
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Serving Capacity</label>
                <input
                  type="number"
                  value={formData.capacity || ''}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  className="form-input"
                  placeholder="Number of people served daily"
                  required
                />
              </div>
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
              <span style={{ fontWeight: '500', color: '#374151' }}>Organization Name:</span>
              <span>{profile.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Type:</span>
              <span style={{ textTransform: 'capitalize' }}>{profile.type?.replace('_', ' ')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Address:</span>
              <span>{profile.address}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Phone:</span>
              <span>{profile.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Serving Capacity:</span>
              <span>{profile.capacity} people daily</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationDashboard;
