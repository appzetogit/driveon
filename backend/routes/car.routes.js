import express from 'express';
import {
  getAllCars,
  getCarById,
  getTopBrands,
  getTopCarTypes,
  getNearbyCars,
} from '../controllers/car.controller.js';

const router = express.Router();

// Public routes
router.get('/', getAllCars);
router.get('/brands/top', getTopBrands);
router.get('/types/top', getTopCarTypes);
router.get('/nearby', getNearbyCars);
router.get('/:carId', getCarById);

export default router;

