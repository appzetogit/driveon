import { seedFleetCars } from '../data/seedFleetData';

const STORAGE_KEY = 'driveon_admin_fleet_v1';

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getInitialState = () => ({
  cars: seedFleetCars,
  bookings: [],
});

export const loadFleetState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return getInitialState();
  const parsed = safeParse(raw, null);
  if (!parsed || typeof parsed !== 'object') return getInitialState();

  // Filter out any legacy mock cars starting with fleet_car_
  const cars = storedCars
    ? storedCars.filter(c => c && !String(c.id).startsWith('fleet_car_out_') && !String(c.id).startsWith('fleet_car_in_'))
    : [];

  const bookings = Array.isArray(parsed.bookings) ? parsed.bookings : [];
  return { cars, bookings };
};

export const saveFleetState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetFleetState = () => {
  localStorage.removeItem(STORAGE_KEY);
};
