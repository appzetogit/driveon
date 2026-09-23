import { createSlice } from '@reduxjs/toolkit';

/**
 * Car Slice
 * Manages car listings, filters, selected car
 */
const initialState = {
  cars: [],
  selectedCar: null,
  filters: {
    brand: [],
    model: [],
    seats: [],
    fuelType: [],
    transmission: [],
    color: [],
    priceRange: { min: 0, max: 100000 },
    rating: 0,
    location: '',
    features: [],
    carType: [],
    availableFrom: null,
    availableTo: null,
  },
  sortBy: 'price-asc', // price-asc, price-desc, rating, newest
  viewMode: 'grid', // grid or list
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
};

const carSlice = createSlice({
  name: 'car',
  initialState,
  reducers: {
    // Car listings
    setCars: (state, action) => {
      state.cars = action.payload;
    },
    addCars: (state, action) => {
      state.cars = [...state.cars, ...action.payload];
    },
    clearCars: (state) => {
      state.cars = [];
    },

    // Selected car
    setSelectedCar: (state, action) => {
      state.selectedCar = action.payload;
    },
    clearSelectedCar: (state) => {
      state.selectedCar = null;
    },

    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    updateFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
      state.pagination.page = 1;
    },

    // Sort
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },

    // View mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    // Pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    nextPage: (state) => {
      if (state.pagination.page < state.pagination.totalPages) {
        state.pagination.page += 1;
      }
    },
    previousPage: (state) => {
      if (state.pagination.page > 1) {
        state.pagination.page -= 1;
      }
    },

    // Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCars,
  addCars,
  clearCars,
  setSelectedCar,
  clearSelectedCar,
  setFilters,
  resetFilters,
  updateFilter,
  setSortBy,
  setViewMode,
  setPagination,
  nextPage,
  previousPage,
  setLoading,
  setError,
  clearError,
} = carSlice.actions;

export default carSlice.reducer;

