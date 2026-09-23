import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BottomNavbar from '../components/layout/BottomNavbar';
import SearchCarCard from '../components/common/SearchCarCard';
import { colors } from '../theme/colors';
import { carService } from '../../services/car.service';

// Import car images for fallback
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg2 from '../../assets/car_img2.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg8 from '../../assets/car_img8.png';

const BrandPage = () => {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fallbackCarImages = [carImg1, carImg6, carImg8, carImg4, carImg5];

  const transformCarData = (car, index = 0) => {
    let carImage = fallbackCarImages[index % fallbackCarImages.length];
    let carImages = [];

    if (car.images && car.images.length > 0) {
      carImages = car.images
        .map(img => {
          if (typeof img === 'string') return img;
          return img?.url || img?.path || null;
        })
        .filter(Boolean);

      carImages = [...new Set(carImages)];
      const primaryImage = car.images.find((img) => img.isPrimary);
      const matchedImage = primaryImage ? (primaryImage.url || primaryImage.path || primaryImage) : (carImages[0] || carImage);
      if (typeof matchedImage === 'string') {
        carImage = matchedImage.startsWith('http') ? matchedImage : `${import.meta.env.VITE_API_BASE_URL || ''}${matchedImage}`;
      }
    } else if (car.image) {
      const matchedImage = typeof car.image === 'string' ? car.image : (car.image?.url || car.image?.path);
      if (typeof matchedImage === 'string') {
        carImage = matchedImage.startsWith('http') ? matchedImage : `${import.meta.env.VITE_API_BASE_URL || ''}${matchedImage}`;
      }
    }

    // Normalize fuel type
    const normalizedFuelType = car.fuelType
      ? car.fuelType.toLowerCase() === 'petrol'
        ? 'Petrol'
        : car.fuelType.toLowerCase() === 'diesel'
          ? 'Diesel'
          : car.fuelType.toLowerCase() === 'electric'
            ? 'Electric'
            : car.fuelType.toLowerCase() === 'hybrid'
              ? 'Hybrid'
              : car.fuelType.charAt(0).toUpperCase() + car.fuelType.slice(1).toLowerCase()
      : '';

    // Normalize transmission
    const normalizedTransmission = car.transmission
      ? car.transmission.toLowerCase() === 'automatic'
        ? 'Automatic'
        : car.transmission.toLowerCase() === 'manual'
          ? 'Manual'
          : car.transmission.toLowerCase() === 'cvt'
            ? 'CVT'
            : car.transmission.charAt(0).toUpperCase() + car.transmission.slice(1).toLowerCase()
      : '';

    return {
      id: car._id || car.id,
      name: `${car.brand} ${car.model}`,
      brand: car.brand,
      model: car.model,
      image: carImage,
      images: carImages,
      rating: car.averageRating ? car.averageRating.toFixed(1) : '5.0',
      location: car.location?.city || car.location?.address || 'Location',
      price: `Rs. ${car.pricePerDay || 0}`,
      pricePerDay: car.pricePerDay || 0,
      fuelType: normalizedFuelType,
      transmission: normalizedTransmission,
      color: car.color || '',
      carType: car.carType || car.bodyType || '',
      features: car.features || [],
      seats: car.seatingCapacity || car.seats || 4,
      seatingCapacity: car.seatingCapacity || car.seats || 4,
      bookings: car.bookings || car.bookingsMap || [],
    };
  };

  useEffect(() => {
    const fetchCarsByBrand = async () => {
      if (!brandName) return;
      try {
        setIsLoading(true);
        const response = await carService.getCars({
          brand: brandName,
          status: 'active',
          limit: 100,
        });

        if (response.success && response.data?.cars) {
          const transformed = response.data.cars.map((car, index) => transformCarData(car, index));
          setCars(transformed);
        } else {
          setCars([]);
        }
      } catch (err) {
        console.error('Error fetching cars by brand:', err);
        setCars([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarsByBrand();
  }, [brandName]);

  return (
    <div
      className="min-h-screen w-full flex flex-col md:hidden"
      style={{ backgroundColor: colors.backgroundPrimary }}
    >
      {/* Header */}
      <header className="px-4 pt-6 pb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-black">
          {brandName} ({isLoading ? '...' : cars.length})
        </h1>
        <div className="w-8 h-8" /> {/* Placeholder for alignment */}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-500 text-center">Loading cars...</p>
          </div>
        ) : cars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Cars Found</h3>
            <p className="text-sm text-gray-500">
              Sorry, we couldn't find any cars from {brandName}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {cars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <SearchCarCard car={car} index={index} />
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default BrandPage;

