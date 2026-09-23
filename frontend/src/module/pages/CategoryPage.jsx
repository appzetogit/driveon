import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNavbar from "../components/layout/BottomNavbar";
import CarCard from "../components/common/CarCard";
import { colors } from "../theme/colors";
import { carService } from "../../services/car.service";

// Import car images for fallback
import carImg1 from "../../assets/car_banImg1.jpg";
import carImg2 from "../../assets/car_banImg2.jpg";
import carImg3 from "../../assets/car_banImg3.jpg";
import carImg4 from "../../assets/car_banImg4.jpg";
import carImg5 from "../../assets/car_banImg5.jpg";
import carImg6 from "../../assets/car_img6-removebg-preview.png";
import nearbyImg1 from "../../assets/car_img8.png";
import nearbyImg2 from "../../assets/car_img4-removebg-preview.png";
import nearbyImg3 from "../../assets/car_img5-removebg-preview.png";

/**
 * CategoryPage Component
 * Shows cars filtered by category (Sports, Electric, Legends, Classic, Coupe, SUV, Sedan, etc.)
 * Fully dynamic - fetches cars from API
 */
const CategoryPage = () => {
  const navigate = useNavigate();
  const { categoryName } = useParams();
  const [cars, setCars] = useState([]);
  const [category, setCategory] = useState({ label: categoryName || "Cars", count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Fallback images array
  const fallbackImages = [carImg1, carImg2, carImg3, carImg4, carImg5, carImg6, nearbyImg1, nearbyImg2, nearbyImg3];

  // Transform car data from API to component format
  const transformCarData = (car, index = 0) => {
    // Get car image - prioritize API images
    let carImage = fallbackImages[index % fallbackImages.length];
    
    if (car.images && Array.isArray(car.images) && car.images.length > 0) {
      // Find primary image or use first image
      const primaryImage = car.images.find((img) => img.isPrimary) || car.images[0];
      
      // Handle image object or string
      if (typeof primaryImage === 'string') {
        carImage = primaryImage.startsWith('http') 
          ? primaryImage 
          : `${import.meta.env.VITE_API_BASE_URL || ''}${primaryImage}`;
      } else if (primaryImage && typeof primaryImage === 'object') {
        // Handle image object with url or path property
        const imageUrl = primaryImage.url || primaryImage.path || primaryImage;
        if (typeof imageUrl === 'string') {
          carImage = imageUrl.startsWith('http') 
            ? imageUrl 
            : `${import.meta.env.VITE_API_BASE_URL || ''}${imageUrl}`;
        }
      }
    } else if (car.image) {
      // Handle single image (string or object)
      if (typeof car.image === 'string') {
        carImage = car.image.startsWith('http') 
          ? car.image 
          : `${import.meta.env.VITE_API_BASE_URL || ''}${car.image}`;
      } else if (typeof car.image === 'object' && car.image.url) {
        const imageUrl = car.image.url || car.image.path;
        if (typeof imageUrl === 'string') {
          carImage = imageUrl.startsWith('http') 
            ? imageUrl 
            : `${import.meta.env.VITE_API_BASE_URL || ''}${imageUrl}`;
        }
      }
    }

    return {
      id: car._id || car.id,
      name: `${car.brand || ''} ${car.model || ''}`.trim() || car.name || 'Car',
      rating: car.averageRating ? car.averageRating.toFixed(1) : '5.0',
      location: car.location?.city || car.location?.address || car.location || 'Location',
      seats: `${car.seatingCapacity || car.seats || 4} Seats`,
      price: `Rs. ${car.pricePerDay || car.price || 0}/Day`,
      image: carImage,
    };
  };

  // Fetch cars by category
  useEffect(() => {
    const fetchCarsByCategory = async () => {
      try {
        setIsLoading(true);
        
        // Normalize category name
        const normalizedCategory = categoryName?.toLowerCase() || '';
        const categoryLabel = categoryName 
          ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()
          : 'Cars';

        // Map common category names to API filter values
        const categoryMap = {
          'sports': 'Sports',
          'electric': 'Electric',
          'legends': 'Legends',
          'classic': 'Classic',
          'coupe': 'Coupe',
          'suv': 'SUV',
          'sedan': 'Sedan',
          'hatchback': 'Hatchback',
          'luxury': 'Luxury',
          'muv': 'MUV',
        };

        const carTypeFilter = categoryMap[normalizedCategory] || categoryLabel;

        // Fetch cars filtered by category
        const response = await carService.getCars({
          carType: carTypeFilter,
          bodyType: carTypeFilter,
          status: 'active',
          limit: 100, // Get more cars for category page
        });

        if (response.success && response.data?.cars) {
          const transformedCars = response.data.cars.map((car, index) => 
            transformCarData(car, index)
          );
          setCars(transformedCars);
          setCategory({
            label: categoryLabel,
            count: response.data.pagination?.total || transformedCars.length,
          });
        } else {
          // If no cars found, set empty array
          setCars([]);
          setCategory({
            label: categoryLabel,
            count: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching cars by category:', error);
        setCars([]);
        setCategory({
          label: categoryName || 'Cars',
          count: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCarsByCategory();
  }, [categoryName]);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header */}
      <div
        className="px-4 pt-6 pb-4"
        style={{ backgroundColor: colors.backgroundSecondary }}
      >
        <div className="flex items-center gap-3 mb-4">
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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{category.label}</h1>
            <p className="text-sm text-gray-500">{category.count} cars available</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 pb-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-gray-500 text-center">Loading cars...</p>
          </div>
        ) : cars.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {cars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <CarCard car={car} index={index} />
              </motion.div>
            ))}
          </div>
        ) : (
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
            <p className="text-gray-500 text-center">
              No cars found in this category
            </p>
          </div>
        )}
      </main>

      {/* Bottom navbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default CategoryPage;

