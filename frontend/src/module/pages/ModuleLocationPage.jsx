import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { colors } from '../theme/colors';
import { useLocation } from '../../hooks/useLocation';
import { useAppSelector } from '../../hooks/redux';

const ModuleLocationPage = () => {
  const navigate = useNavigate();
  
  // Get authentication state
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { user } = useAppSelector((state) => state.user);
  
  // Get user's current live location
  const { currentLocation, isLoading: locationLoading } = useLocation(true, isAuthenticated, user?._id || user?.id);
  
  const [pickup, setPickup] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Set current location as default pickup when it's available
  useEffect(() => {
    if (currentLocation && (!pickup || pickup === 'Getting location...')) {
      setPickup(currentLocation);
    }
  }, [currentLocation]);
  
  // Handle "Current Location" button click
  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setPickup(currentLocation);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Handle selecting a location
  const handleSelectLocation = (locationName) => {
    setPickup(locationName);
    setSearchQuery('');
    // After selection, navigate back or to search with this location
    setTimeout(() => {
        navigate('/module-test'); // Assuming this is the home page based on previous turns
    }, 300);
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Header with Gradient */}
      <div 
        className="pt-12 pb-24 px-6 rounded-b-[40px] relative z-10"
        style={{ background: colors.gradientHeader || 'linear-gradient(180deg, #1C205C 0%, #0D102D 100%)' }}
      >
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={handleBack}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 transition-all hover:bg-white/20"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-2xl font-black text-white tracking-wider uppercase">Plan Your Route</h1>
        </div>

        {/* Floating Input Card */}
        <div 
          className="absolute left-6 right-6 -bottom-10 bg-white rounded-3xl shadow-2xl p-4 flex flex-col gap-0 border border-gray-100"
          style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
        >
          {/* Pickup Location Only */}
          <div className="flex items-start gap-4 p-3 rounded-2xl transition-colors hover:bg-blue-50/50">
            <div className="mt-1 relative flex flex-col items-center">
              <div className="w-4 h-4 rounded-full border-4 border-white ring-2 ring-blue-400 bg-blue-400"></div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Pickup Location</p>
              <input 
                type="text" 
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  setSearchQuery(e.target.value);
                }}
                autoFocus
                className="w-full text-base font-semibold text-gray-800 bg-transparent outline-none focus:ring-0 placeholder:text-gray-400"
                placeholder="Where from?"
              />
            </div>
            <button 
              className="mt-1 text-gray-400"
              onClick={handleUseCurrentLocation}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 mt-20 px-6 pb-10 overflow-y-auto">
        {/* Current Location Button */}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleUseCurrentLocation}
          className="w-full mt-4 flex items-center gap-4 p-4 rounded-3xl border border-blue-50 bg-blue-50/30 transition-all hover:bg-blue-50"
        >
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
             </svg>
          </div>
          <div className="text-left flex-1">
            <h3 className="font-bold text-blue-900 leading-tight">Current Location</h3>
            <p className="text-xs text-blue-500 font-medium">Use my precise GPS location</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>

        <div className="h-[1px] w-full bg-gray-100 my-8"></div>

        {/* Empty State / Results */}
        <AnimatePresence mode="wait">
          {!searchQuery ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                 </svg>
              </div>
              <p className="text-gray-500 font-bold mb-1">No locations found</p>
              <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">Start typing to search for places</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2"
            >
               {/* Search results would go here */}
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Search Results</p>
               {['Mumbai', 'Delhi', 'Bangalore'].map((city, item) => (
                  <button 
                    key={item} 
                    onClick={() => handleSelectLocation(city)}
                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors"
                  >
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                           <circle cx="12" cy="10" r="3" />
                        </svg>
                     </div>
                     <div className="text-left">
                        <p className="font-semibold text-gray-800">{city}</p>
                        <p className="text-xs text-gray-400">Popular city in India</p>
                     </div>
                  </button>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ModuleLocationPage;
