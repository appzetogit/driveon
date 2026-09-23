
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { colors } from '../theme/colors';
import { useFavorites } from '../../context/FavoritesContext';
import { useAppSelector } from '../../hooks/redux';
import CarCard from '../components/common/CarCard';
import SearchHeader from '../components/layout/SearchHeader';

const ModuleFavoritesPage = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { user } = useAppSelector((state) => state.user);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Helper for profile initials
  const getInitial = (name) => {
    if (!name || name.trim() === "") return "U";
    return name.trim().charAt(0).toUpperCase();
  };

  const userPhoto = user?.profilePhoto && user.profilePhoto.trim() !== "" ? user.profilePhoto : null;
  const userName = user?.name || user?.fullName || "User";

  return (
    <div 
      className="min-h-screen w-full pb-6"
      style={{ backgroundColor: colors.backgroundPrimary || "#F1F2F4" }}
    >
      {/* 
        ----------------------------------------------------
        WEB HEADER (Desktop View)
        Consistent with ModuleProfile1Page
        ----------------------------------------------------
      */}
      <header
        className="hidden md:block w-full sticky top-0 z-50 shadow-sm"
        style={{ backgroundColor: colors.brandBlack || "#1C205C" }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center h-16 md:h-20 lg:h-24 justify-between">
            {/* Left - Logo */}
            <Link to="/" className="flex-shrink-0">
              <img
                src="/driveonlogo.png"
                alt="DriveOn Logo"
                className="h-8 md:h-10 lg:h-12 xl:h-14 w-auto object-contain"
              />
            </Link>

            {/* Center - Navigation Tabs */}
            <nav className="flex items-center justify-center gap-4 md:gap-6 lg:gap-8 xl:gap-10 h-full">
              <Link
                to="/"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                Contact
              </Link>
              <Link
                to="/faq"
                className="text-xs md:text-sm lg:text-base xl:text-lg font-medium transition-all hover:opacity-80 flex items-center h-full"
                style={{ color: colors.textWhite || "#ffffff" }}
              >
                FAQs
              </Link>
            </nav>

            {/* Right - Profile Icon */}
            <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
              {isAuthenticated && (
                <Link
                  to="/profile"
                  className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full border-2 border-white flex items-center justify-center overflow-hidden bg-gray-800">
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg">
                         {getInitial(userName)}
                      </div>
                    )}
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 
        ----------------------------------------------------
        MOBILE HEADER (Original SearchHeader)
        ----------------------------------------------------
      */}
      <div className="md:hidden">
        <SearchHeader title="My Favorites" backRoute="/" />
      </div>

      {/* 
        ----------------------------------------------------
        MAIN CONTENT
        ----------------------------------------------------
      */}
      <div className="px-4 md:px-8 max-w-7xl mx-auto pt-4 md:pt-10">
        
        {/* Web View Title Section */}
        {/* Web View Title Section */}
        <div className="hidden md:flex flex-col mb-8 border-b pb-4 border-gray-200">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm group"
            >
              <svg 
                className="w-5 h-5 text-gray-600 group-hover:text-gray-900" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2.5} 
                  d="M15 19l-7-7 7-7" 
                />
              </svg>
            </button>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">My Favorites</h1>
          </div>
          <p className="text-lg text-gray-600 ml-14">Your curated collection of premium cars, ready for your next journey.</p>
        </div>
        
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl shadow-sm md:shadow-md border border-gray-100 p-8">
            <div className="w-24 h-24 mb-6 rounded-full bg-gray-50 flex items-center justify-center">
               <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
               </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Favorites Yet</h2>
            <p className="text-gray-500 mb-8 max-w-md text-lg">
              Start exploring our premium fleet and click the heart icon on your favorite cars to save them here for quick access.
            </p>
            <button
              onClick={() => navigate('/search')}
              className="px-8 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-900/20 transform transition hover:scale-105 active:scale-95"
              style={{ backgroundColor: colors.backgroundTertiary }}
            >
              Explore Cars
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {favorites.map((car, index) => (
              <CarCard key={car.id} car={car} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleFavoritesPage;
