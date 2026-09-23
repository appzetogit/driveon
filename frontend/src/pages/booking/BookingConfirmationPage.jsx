import { useParams } from 'react-router-dom';
import LocationTracker from '../../components/common/LocationTracker';
import { useAppSelector } from '../../hooks/redux';

const BookingConfirmationPage = () => {
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.user);

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container-mobile py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Booking Confirmed</h1>
        <p className="text-text-secondary">Booking ID: {id}</p>
        <p className="text-text-secondary">Coming soon</p>

        {/* Hidden auto location tracking after booking */}
        {user && (
          <LocationTracker
            userId={user._id || user.id}
            userType="user"
            autoStart={true}
            hidden={true}
          />
        )}
      </div>
    </div>
  );
};

export default BookingConfirmationPage;

