import { useAuth } from '../../state/auth';
import { CustomerSettingsPage } from '../Customer/Settings';
import { ProviderSettingsPage } from '../Provider/Settings';

export function ProfilePage() {
  const { user } = useAuth();

  if (user?.role === 'PROVIDER') {
    return <ProviderSettingsPage />;
  }

  if (user?.role === 'CUSTOMER') {
    return <CustomerSettingsPage />;
  }

  return (
    <div className="pt-24 text-center">
      <h1 className="text-2xl font-bold">Profile Not Found</h1>
      <p className="text-gray-600">Please login to view your profile.</p>
    </div>
  );
}
