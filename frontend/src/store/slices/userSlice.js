import { createSlice } from '@reduxjs/toolkit';

/**
 * User Slice
 * Manages user profile data, KYC status, profile completion
 */
const safeGetItem = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };

const initialState = {
  user: null,
  profileComplete: safeGetItem('profileComplete') === 'true' || false,
  kycStatus: {
    aadhaar: false,
    pan: false,
    drivingLicense: false,
    verified: false,
  },
  guarantor: {
    added: false,
    verified: false,
    details: null,
  },
  referralCode: null,
  points: 0,
  isLoading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // User profile actions
    setUser: (state, action) => {
      state.user = action.payload;
    },
    updateUser: (state, action) => {
      // If user is null, set it directly; otherwise merge
      if (!state.user) {
        state.user = action.payload;
      } else {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.profileComplete = false;
      state.kycStatus = {
        aadhaar: false,
        pan: false,
        drivingLicense: false,
        verified: false,
      };
      state.guarantor = {
        added: false,
        verified: false,
        details: null,
      };
    },

    // Profile completion
    setProfileComplete: (state, action) => {
      state.profileComplete = action.payload;
      localStorage.setItem('profileComplete', action.payload.toString());
    },

    // KYC status
    setKYCStatus: (state, action) => {
      state.kycStatus = { ...state.kycStatus, ...action.payload };
      // If all documents verified, mark as verified
      if (
        state.kycStatus.aadhaar &&
        state.kycStatus.pan &&
        state.kycStatus.drivingLicense
      ) {
        state.kycStatus.verified = true;
      }
    },

    // Guarantor
    setGuarantor: (state, action) => {
      state.guarantor = { ...state.guarantor, ...action.payload };
    },
    clearGuarantor: (state) => {
      state.guarantor = {
        added: false,
        verified: false,
        details: null,
      };
    },

    // Referral
    setReferralCode: (state, action) => {
      state.referralCode = action.payload;
    },
    setPoints: (state, action) => {
      state.points = action.payload;
    },
    addPoints: (state, action) => {
      state.points += action.payload;
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
  setUser,
  updateUser,
  clearUser,
  setProfileComplete,
  setKYCStatus,
  setGuarantor,
  clearGuarantor,
  setReferralCode,
  setPoints,
  addPoints,
  setLoading,
  setError,
  clearError,
} = userSlice.actions;

export default userSlice.reducer;

