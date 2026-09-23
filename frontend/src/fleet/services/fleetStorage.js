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

  const storedCars = Array.isArray(parsed.cars) ? parsed.cars : null;
  const seedById = new Map(seedFleetCars.map((c) => [c.id, c]));

  // Backward-compatible migration:
  // - merge new seed fields (e.g., ownerName/ownerPhone) into any cars already saved in localStorage
  // - keep any user-stored overrides
  // - keep any extra cars not present in seed
  const cars = storedCars
    ? [
        ...storedCars.map((stored) => {
          const seed = seedById.get(stored?.id);
          return seed ? { ...seed, ...stored } : stored;
        }),
        ...seedFleetCars.filter((seed) => !storedCars.some((c) => c?.id === seed.id)),
      ]
    : seedFleetCars;

  const bookings = Array.isArray(parsed.bookings) ? parsed.bookings : [];
  return { cars, bookings };
};

export const saveFleetState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetFleetState = () => {
  localStorage.removeItem(STORAGE_KEY);
};
