import { createSlice } from '@reduxjs/toolkit';

/**
 * Booking Slice
 * Manages current booking, booking history
 */
const initialState = {
  currentBooking: null,
  bookings: [],
  bookingHistory: [],
  activeBooking: null,
  bookingFilters: {
    status: 'all', // all, pending, confirmed, active, completed, cancelled
    dateFrom: null,
    dateTo: null,
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    // Current booking (booking in progress)
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    updateCurrentBooking: (state, action) => {
      state.currentBooking = { ...state.currentBooking, ...action.payload };
    },

    // Bookings list
    setBookings: (state, action) => {
      state.bookings = action.payload;
    },
    addBooking: (state, action) => {
      state.bookings = [action.payload, ...state.bookings];
    },
    updateBooking: (state, action) => {
      const index = state.bookings.findIndex(
        (b) => b.id === action.payload.id
      );
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], ...action.payload };
      }
    },

    // Booking history
    setBookingHistory: (state, action) => {
      state.bookingHistory = action.payload;
    },
    addToHistory: (state, action) => {
      state.bookingHistory = [action.payload, ...state.bookingHistory];
    },

    // Active booking
    setActiveBooking: (state, action) => {
      state.activeBooking = action.payload;
    },
    clearActiveBooking: (state) => {
      state.activeBooking = null;
    },

    // Filters
    setBookingFilters: (state, action) => {
      state.bookingFilters = { ...state.bookingFilters, ...action.payload };
      state.pagination.page = 1;
    },
    resetBookingFilters: (state) => {
      state.bookingFilters = initialState.bookingFilters;
      state.pagination.page = 1;
    },

    // Pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
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
  setCurrentBooking,
  clearCurrentBooking,
  updateCurrentBooking,
  setBookings,
  addBooking,
  updateBooking,
  setBookingHistory,
  addToHistory,
  setActiveBooking,
  clearActiveBooking,
  setBookingFilters,
  resetBookingFilters,
  setPagination,
  setLoading,
  setError,
  clearError,
} = bookingSlice.actions;

export default bookingSlice.reducer;

