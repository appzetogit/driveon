
import React, { createContext, useContext, useState, useEffect } from 'react';

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const storedFavorites = localStorage.getItem('driveon:favorites');
      return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (error) {
      console.warn('Failed to parse favorites from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('driveon:favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (car) => {
    setFavorites((prev) => {
      // Avoid duplicates
      if (prev.some((fav) => fav.id === car.id)) return prev;
      return [...prev, car];
    });
  };

  const removeFavorite = (carId) => {
    setFavorites((prev) => prev.filter((car) => car.id !== carId));
  };

  const isFavorite = (carId) => {
    return favorites.some((car) => car.id === carId);
  };

  const toggleFavorite = (car) => {
    if (isFavorite(car.id)) {
      removeFavorite(car.id);
      return false; // Result is not favorite
    } else {
      addFavorite(car);
      return true; // Result is favorite
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
