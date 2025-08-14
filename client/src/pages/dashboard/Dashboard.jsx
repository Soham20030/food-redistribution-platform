import { useAuth } from '../../context/AuthContext';
import RestaurantDashboard from './RestaurantDashboard';
import OrganizationDashboard from './OrganizationDashboard';
import VolunteerDashboard from './VolunteerDashboard';

function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="content-wrapper">
        <div className="container">
          <div className="text-center">
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Route to role-specific dashboard
  switch (user.role) {
    case 'restaurant':
      return <RestaurantDashboard />;
    case 'organization':
      return <OrganizationDashboard />;
    case 'volunteer':
      return <VolunteerDashboard />;
    default:
      return (
        <div className="content-wrapper">
          <div className="container">
            <div className="card">
              <p>Unknown user role. Please contact support.</p>
            </div>
          </div>
        </div>
      );
  }
}

export default Dashboard;
