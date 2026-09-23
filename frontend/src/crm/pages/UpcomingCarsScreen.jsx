import React, { useState, useEffect } from 'react';
import { commonService } from '../../services/common.service';
import { MdFullscreen, MdFullscreenExit, MdDirectionsCar, MdLocationOn } from 'react-icons/md';
import { premiumColors } from '../../theme/colors';
import { motion } from 'framer-motion';

// Import fallback car images
import carImg1 from '../../assets/car_img1-removebg-preview.png';
import carImg4 from '../../assets/car_img4-removebg-preview.png';
import carImg5 from '../../assets/car_img5-removebg-preview.png';
import carImg6 from '../../assets/car_img6-removebg-preview.png';
import carImg8 from '../../assets/car_img8.png';

const fallbackCarImages = [carImg1, carImg6, carImg8, carImg4, carImg5];

const UpcomingCarsScreen = () => {
  const [returningCars, setReturningCars] = useState([]);
  const [currentCarIndex, setCurrentCarIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchReturningCars();
    // Poll every 30 seconds to keep screen live
    const interval = setInterval(fetchReturningCars, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rotate returning cars banner every 10 seconds if multiple exist
  useEffect(() => {
    if (returningCars.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCarIndex((prev) => (prev + 1) % returningCars.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [returningCars.length]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchReturningCars = async () => {
    try {
      setLoading(true);
      const response = await commonService.getReturningCars();
      if (response.success && response.data?.cars) {
        setReturningCars(response.data.cars);
      }
    } catch (error) {
      console.error('Error fetching returning cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getCarImage = (car, index) => {
    let carImage = fallbackCarImages[index % fallbackCarImages.length];
    if (car.image) {
      carImage = car.image;
    } else if (car.images && car.images.length > 0) {
      const imgObj = car.images[0];
      const path = typeof imgObj === 'string' ? imgObj : (imgObj.url || imgObj.path);
      if (path) {
        carImage = path.startsWith('http') ? path : `${import.meta.env.VITE_API_BASE_URL || ''}${path}`;
      }
    }
    return carImage;
  };

  // Render the exact same banner details
  const renderBanner = (car, index, isLarge = false) => {
    const returnTime = car.returningDate 
      ? new Date(car.returningDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      : '';

    const fullName = `${car.brand} ${car.model}`;
    let fontSizeClass = '';
    
    if (isLarge) {
      if (fullName.length > 25) {
        fontSizeClass = 'text-3xl md:text-[3.2rem] lg:text-[4rem] xl:text-[4.6rem]';
      } else if (fullName.length > 18) {
        fontSizeClass = 'text-4xl md:text-[4rem] lg:text-[4.8rem] xl:text-[5.5rem]';
      } else if (fullName.length > 12) {
        fontSizeClass = 'text-4xl md:text-[4.6rem] lg:text-[5.5rem] xl:text-[6.4rem]';
      } else {
        fontSizeClass = 'text-5xl md:text-[5.5rem] lg:text-[6.5rem] xl:text-[7.5rem]';
      }
    } else {
      if (fullName.length > 20) {
        fontSizeClass = 'text-2xl md:text-3xl';
      } else if (fullName.length > 12) {
        fontSizeClass = 'text-3xl md:text-4xl';
      } else {
        fontSizeClass = 'text-4xl md:text-5xl';
      }
    }

    return (
      <div 
        key={car._id || car.id || index}
        className={`w-full bg-gradient-to-br from-[#1C205C] to-[#0D102D] text-white rounded-[2.5rem] shadow-2xl border border-indigo-950 flex items-center justify-between transition-all duration-300 mx-auto
          ${isLarge 
            ? 'p-12 md:p-16 gap-10 md:gap-14 w-[90vw] max-w-[90vw] h-[72vh] min-h-[500px] lg:min-h-[600px] rounded-[3.5rem]' 
            : 'p-10 gap-10 max-w-5xl min-h-[320px]'
          }`}
      >
        <div className="flex-1 min-w-0 text-left">
          <div className={`flex items-center gap-4 ${isLarge ? 'mb-6' : 'mb-3'}`}>
            <span className={`inline-block rounded-full bg-emerald-500 animate-ping ${isLarge ? 'w-5 h-5' : 'w-3.5 h-3.5'}`}></span>
            <span className={`font-bold text-emerald-400 uppercase tracking-widest ${isLarge ? 'text-xl md:text-2xl lg:text-3xl' : 'text-sm md:text-base'}`}>
              Upcoming Car Today
            </span>
          </div>
          <h3 className={`font-black text-white leading-none mb-6 pb-2 whitespace-normal break-words ${fontSizeClass}`}>
            {fullName}
          </h3>
          <p className={`text-gray-300 leading-relaxed ${isLarge ? 'text-2xl md:text-3xl lg:text-4xl mb-3' : 'text-2xl md:text-3xl mb-1'}`}>
            Returning at <span className="font-extrabold text-white">{returnTime}</span>
          </p>
          <p className={`text-emerald-400 font-extrabold ${isLarge ? 'text-xl md:text-2xl lg:text-3xl mb-6' : 'text-xl md:text-2xl mb-3'}`}>
            (in {car.returningIn || "a few hours"})
          </p>
          <div className={`flex items-center gap-3 text-gray-400 ${isLarge ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-base md:text-lg'}`}>
            <MdLocationOn className="shrink-0 text-gray-400" size={isLarge ? 44 : 24} />
            <span className="truncate">{car.location?.city || car.location?.address || car.location || "Nearby"}</span>
          </div>
        </div>
        <div className={`flex items-center justify-center relative flex-shrink-0 ${isLarge ? 'w-[42%] h-[320px] lg:h-[420px]' : 'w-64 h-40'}`}>
          <img 
            src={getCarImage(car, index)} 
            alt={`${car.brand} ${car.model}`}
            className={`w-auto object-contain select-none pointer-events-none ${isLarge ? 'transform scale-120' : 'transform scale-125'}`}
            style={{ maxHeight: isLarge ? '380px' : '160px' }}
          />
        </div>
      </div>
    );
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#050716] flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
        <button
          onClick={handleFullscreenToggle}
          className="absolute top-6 right-6 px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg flex items-center gap-2 transition-all font-semibold"
        >
          <MdFullscreenExit size={20} />
          Exit Fullscreen
        </button>

        <div className="w-full flex flex-col items-center justify-center gap-12">
          {returningCars.length > 0 ? (
            <motion.div
              key={returningCars[currentCarIndex]?.id || returningCars[currentCarIndex]?._id || currentCarIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full overflow-hidden"
            >
              {renderBanner(returningCars[currentCarIndex], currentCarIndex, true)}
            </motion.div>
          ) : (
            <div className="text-center text-white space-y-4">
              <div className="animate-pulse bg-white/10 p-6 rounded-full inline-block">
                <MdDirectionsCar size={64} className="text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold">No Upcoming Cars</h2>
              <p className="text-gray-400 text-lg">There are no rented cars scheduled to return today.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Upcoming Cars Screen</h1>
          <p className="text-gray-500 text-sm">Monitor cars returning today in real-time.</p>
        </div>
        <button
          onClick={handleFullscreenToggle}
          className="px-4 py-2 text-white rounded-xl flex items-center gap-2 transition-all font-bold shadow-md hover:opacity-90"
          style={{ backgroundColor: premiumColors.primary.DEFAULT }}
        >
          <MdFullscreen size={20} />
          Full Screen
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm min-h-[400px] flex flex-col items-center justify-center">
        {loading && returningCars.length === 0 ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Checking for returning cars...</p>
          </div>
        ) : returningCars.length > 0 ? (
          <div className="w-full max-w-5xl space-y-6 animate-fade-in overflow-hidden">
            <motion.div
              key={returningCars[currentCarIndex]?.id || returningCars[currentCarIndex]?._id || currentCarIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {renderBanner(returningCars[currentCarIndex], currentCarIndex, false)}
            </motion.div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-full inline-block text-gray-400">
              <MdDirectionsCar size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">No Upcoming Cars Today</h3>
            <p className="text-gray-500 max-w-sm mx-auto">There are no rented cars scheduled to return today.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingCarsScreen;
