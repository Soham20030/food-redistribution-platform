import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

function RestaurantDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [foodListings, setFoodListings] = useState([]);
  const [completedListings, setCompletedListings] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashData, listings, completedData, claimsData] = await Promise.all([
        api.get('/dashboard/restaurant'),
        api.get('/food-listings/my-listings'),
        api.get('/food-listings/my-listings?status=completed'),
        api.get('/food-claims/restaurant-claims')
      ]);
      
      setDashboardData(dashData.dashboard);
      setFoodListings(listings.listings);
      setCompletedListings(completedData.listings);
      setClaims(claimsData.claims);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'listings', label: 'Active Listings', icon: '🍽️' },
    { id: 'completed', label: 'Completed', icon: '✅' },
    { id: 'claims', label: 'Claims', icon: '📋' },
    { id: 'profile', label: 'Profile', icon: '🏪' }
  ];

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="container text-center">
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <p>Loading your restaurant dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="container">
        {/* Header */}
        <div className="mb-5">
          <h1 className="heading-2">🏪 Restaurant Dashboard</h1>
          <p className="text-muted">
            Hey {user.first_name}! Ready to share some delicious food today?
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
        {activeTab === 'listings' && (
          <ListingsTab 
            listings={foodListings} 
            onRefresh={loadDashboardData}
            showCreateForm={showCreateForm}
            setShowCreateForm={setShowCreateForm}
          />
        )}
        {activeTab === 'completed' && <CompletedListingsTab listings={completedListings} />}
        {activeTab === 'claims' && <ClaimsTab claims={claims} onRefresh={loadDashboardData} />}
        {activeTab === 'profile' && <ProfileTab onRefresh={loadDashboardData} />}
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
    { label: 'Total Food Listings', value: data.total_listings, icon: '🍽️', color: '#667eea' },
    { label: 'Active Listings', value: data.active_listings, icon: '✨', color: '#f5576c' },
    { label: 'Total Claims Received', value: data.total_claims, icon: '📋', color: '#4facfe' },
    { label: 'Servings Donated', value: data.total_servings_donated, icon: '🤝', color: '#fa709a' }
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

      {/* Recent Claims */}
      {data.recent_claims && data.recent_claims.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Claims Activity</h3>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {data.recent_claims.slice(0, 3).map((claim) => (
              <div key={claim.id} style={{
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{claim.title}</h4>
                    <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                      {claim.organization_name} • {claim.claimed_quantity} servings
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: claim.status === 'pending' ? '#fef3c7' : 
                              claim.status === 'approved' ? '#d1fae5' : '#fee2e2',
                    color: claim.status === 'pending' ? '#92400e' : 
                           claim.status === 'approved' ? '#065f46' : '#991b1b'
                  }}>
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {data.pending_claims > 0 && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⏰</div>
              <p style={{ margin: '0', fontWeight: '500', color: '#92400e' }}>
                You have {data.pending_claims} claim{data.pending_claims !== 1 ? 's' : ''} waiting for your response!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Listings Tab Component
function ListingsTab({ listings, onRefresh, showCreateForm, setShowCreateForm }) {
  const [editingListing, setEditingListing] = useState(null);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this food listing?')) {
      try {
        await api.delete(`/food-listings/${id}`);
        onRefresh();
      } catch (error) {
        alert('Error deleting listing: ' + error.message);
      }
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
      {/* Header with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="heading-3">Your Active Food Listings</h3>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          ➕ Create New Listing
        </button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingListing) && (
        <FoodListingForm 
          listing={editingListing}
          onClose={() => {
            setShowCreateForm(false);
            setEditingListing(null);
          }}
          onSuccess={() => {
            setShowCreateForm(false);
            setEditingListing(null);
            onRefresh();
          }}
        />
      )}

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="card text-center">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽️</div>
          <h3 style={{ marginBottom: '12px' }}>No active food listings</h3>
          <p className="text-muted mb-4">Create your first listing to start sharing surplus food with your community.</p>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="feature-grid">
          {listings.map((listing) => (
            <div key={listing.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: '0', color: '#1f2937' }}>{listing.title}</h4>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: listing.status === 'available' ? '#d1fae5' : 
                            listing.status === 'claimed' ? '#fef3c7' : '#e5e7eb',
                  color: listing.status === 'available' ? '#065f46' : 
                         listing.status === 'claimed' ? '#92400e' : '#374151'
                }}>
                  {listing.status}
                </span>
              </div>
              
              <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                {listing.description}
              </p>
              
              <div style={{ display: 'grid', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Quantity:</span>
                  <span>{listing.quantity} {listing.unit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Food Type:</span>
                  <span>{listing.food_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Pickup:</span>
                  <span>{formatDate(listing.pickup_time_start)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Expires:</span>
                  <span>{formatDate(listing.expiry_date)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setEditingListing(listing)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px 16px', fontSize: '14px', minWidth: '100px' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(listing.id)}
                  className="btn btn-danger"
                  style={{ flex: 1, padding: '8px 16px', fontSize: '14px', minWidth: '100px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Completed Listings Tab Component
function CompletedListingsTab({ listings }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (listings.length === 0) {
    return (
      <div className="card text-center">
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
        <h3 style={{ marginBottom: '12px' }}>No completed listings yet</h3>
        <p className="text-muted">Completed food donations will appear here once the pickup process is finished.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="heading-3" style={{ marginBottom: '24px' }}>Completed Food Donations</h3>
      
      <div className="feature-grid">
        {listings.map((listing) => (
          <div key={listing.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h4 style={{ margin: '0', color: '#1f2937' }}>{listing.title}</h4>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                background: '#d1fae5',
                color: '#065f46'
              }}>
                ✅ Completed
              </span>
            </div>
            
            <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
              {listing.description}
            </p>
            
            <div style={{ display: 'grid', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Quantity Donated:</span>
                <span>{listing.quantity} {listing.unit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Food Type:</span>
                <span>{listing.food_type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Completed:</span>
                <span>{formatDate(listing.updated_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Total Claims:</span>
                <span>{listing.total_claims}</span>
              </div>
            </div>

            <div style={{
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
                🎉 Thank you for reducing food waste!
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Food Listing Form Component
function FoodListingForm({ listing, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: listing?.title || '',
    description: listing?.description || '',
    food_type: listing?.food_type || '',
    quantity: listing?.quantity || '',
    unit: listing?.unit || 'servings',
    expiry_date: listing?.expiry_date ? listing.expiry_date.slice(0, 16) : '',
    pickup_time_start: listing?.pickup_time_start ? listing.pickup_time_start.slice(0, 16) : '',
    pickup_time_end: listing?.pickup_time_end ? listing.pickup_time_end.slice(0, 16) : '',
    special_instructions: listing?.special_instructions || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const submitData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        expiry_date: new Date(formData.expiry_date).toISOString(),
        pickup_time_start: new Date(formData.pickup_time_start).toISOString(),
        pickup_time_end: new Date(formData.pickup_time_end).toISOString()
      };

      if (listing) {
        await api.put(`/food-listings/${listing.id}`, submitData);
      } else {
        await api.post('/food-listings', submitData);
      }
      
      onSuccess();
    } catch (error) {
      setError(error.message || 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '32px' }}>
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="card-title">
            {listing ? 'Edit Food Listing' : 'Create New Food Listing'}
          </h3>
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

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Food Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Fresh Pizza Slices"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Food Type</label>
            <input
              type="text"
              name="food_type"
              value={formData.food_type}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Italian, Mexican"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            rows="3"
            placeholder="Describe the food, its condition, how it's stored..."
            required
          />
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="form-input"
              min="1"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="servings">Servings</option>
              <option value="items">Items</option>
              <option value="kg">Kilograms</option>
              <option value="lbs">Pounds</option>
              <option value="pieces">Pieces</option>
            </select>
          </div>
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Pickup Start Time</label>
            <input
              type="datetime-local"
              name="pickup_time_start"
              value={formData.pickup_time_start}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Pickup End Time</label>
            <input
              type="datetime-local"
              name="pickup_time_end"
              value={formData.pickup_time_end}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Expiry Date & Time</label>
          <input
            type="datetime-local"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Special Instructions</label>
          <textarea
            name="special_instructions"
            value={formData.special_instructions}
            onChange={handleChange}
            className="form-input"
            rows="2"
            placeholder="Any special pickup instructions, storage requirements, etc."
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
            {loading ? 'Saving...' : (listing ? 'Update Listing' : 'Create Listing')}
          </button>
        </div>
      </form>
    </div>
  );
}

// Claims Tab Component
function ClaimsTab({ claims, onRefresh }) {
  const handleStatusUpdate = async (claimId, status, notes = '') => {
    try {
      await api.put(`/food-claims/${claimId}/status`, { status, notes });
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

  if (claims.length === 0) {
    return (
      <div className="card text-center">
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
        <h3 style={{ marginBottom: '12px' }}>No claims yet</h3>
        <p className="text-muted">When organizations claim your food listings, they'll appear here for your review.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="heading-3" style={{ marginBottom: '24px' }}>Incoming Claims</h3>
      
      <div style={{ display: 'grid', gap: '20px' }}>
        {claims.map((claim) => (
          <div key={claim.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{claim.title}</h4>
                <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
                  Claimed by <strong>{claim.organization_name}</strong>
                </p>
              </div>
              <span style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                background: claim.status === 'pending' ? '#fef3c7' : 
                          claim.status === 'approved' ? '#d1fae5' : 
                          claim.status === 'completed' ? '#dbeafe' : '#fee2e2',
                color: claim.status === 'pending' ? '#92400e' : 
                       claim.status === 'approved' ? '#065f46' : 
                       claim.status === 'completed' ? '#1e40af' : '#991b1b'
              }}>
                {claim.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px', fontSize: '14px' }}>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <span className="text-muted">Quantity Claimed:</span> {claim.claimed_quantity} servings
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span className="text-muted">Pickup Time:</span> {formatDate(claim.pickup_scheduled_time)}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span className="text-muted">Organization:</span> {claim.organization_type}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span className="text-muted">Contact:</span> {claim.organization_contact_first_name} {claim.organization_contact_last_name}
                </div>
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
                  Organization Notes:
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>{claim.notes}</div>
              </div>
            )}

            {claim.status === 'pending' && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => handleStatusUpdate(claim.id, 'approved', 'Claim approved! Food is ready for pickup.')}
                  className="btn btn-success"
                  style={{ flex: 1, fontSize: '14px', minWidth: '120px' }}
                >
                  ✓ Approve
                </button>
                <button 
                  onClick={() => {
                    const reason = prompt('Please provide a reason for rejection:');
                    if (reason) {
                      handleStatusUpdate(claim.id, 'rejected', reason);
                    }
                  }}
                  className="btn btn-danger"
                  style={{ flex: 1, fontSize: '14px', minWidth: '120px' }}
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ onRefresh }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/restaurants/profile');
      setProfile(response.restaurant);
      setFormData(response.restaurant);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/restaurants/profile', formData);
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
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏪</div>
        <h3 style={{ marginBottom: '12px' }}>Complete Your Restaurant Profile</h3>
        <p className="text-muted mb-4">
          Set up your restaurant information to start sharing food with the community.
        </p>
        <button 
          onClick={() => setEditing(true)}
          className="btn btn-primary"
        >
          Create Restaurant Profile
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="heading-3">Restaurant Profile</h3>
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
              <label className="form-label">Restaurant Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                required
              />
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
                <label className="form-label">Cuisine Type</label>
                <input
                  type="text"
                  value={formData.cuisine_type || ''}
                  onChange={(e) => setFormData({...formData, cuisine_type: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Operating Hours</label>
              <input
                type="text"
                value={formData.operating_hours || ''}
                onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                className="form-input"
                placeholder="e.g., Mon-Fri: 9AM-10PM, Weekends: 10AM-11PM"
                required
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
              <span style={{ fontWeight: '500', color: '#374151' }}>Restaurant Name:</span>
              <span>{profile.name}</span>
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
              <span style={{ fontWeight: '500', color: '#374151' }}>Cuisine Type:</span>
              <span>{profile.cuisine_type}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontWeight: '500', color: '#374151' }}>Operating Hours:</span>
              <span>{profile.operating_hours}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDashboard;
