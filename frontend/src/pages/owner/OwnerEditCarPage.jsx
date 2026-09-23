import { useParams } from 'react-router-dom';

const OwnerEditCarPage = () => {
  const { id } = useParams();
  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container-mobile py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">Edit Car</h1>
        <p className="text-text-secondary">Car ID: {id}</p>
        <p className="text-text-secondary">Coming soon</p>
      </div>
    </div>
  );
};

export default OwnerEditCarPage;

