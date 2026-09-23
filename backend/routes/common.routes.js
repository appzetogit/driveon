import express from 'express';
import {
  getHeroBanners,
  getFAQs,
  getPromotionalBanner,
  getBannerOverlay,
  searchPlaces,
  getReturningCars,
  getCarSpecificCoupons,
  getPublicSettings,
} from '../controllers/common.controller.js';
import { getAddOnServicesPrices, getCustomAddOnServices, getAddOnServices } from '../controllers/addonServices.controller.js';
import { getPolicyByKey } from '../controllers/policy.controller.js';
import { getActiveBanners } from '../controllers/banner.controller.js';

const router = express.Router();

// Public routes
router.get('/settings', getPublicSettings);
router.get('/banners/hero', getHeroBanners);
router.get('/banners/promotional', getPromotionalBanner);
router.get('/banners/overlay', getBannerOverlay);
router.get('/banners/active', getActiveBanners);
router.get('/faqs', getFAQs);
router.get('/places/search', searchPlaces);
router.get('/addon-services', getAddOnServices);
router.get('/addon-services/prices', getAddOnServicesPrices);
router.get('/addon-services/custom', getCustomAddOnServices);
router.get('/returning-cars', getReturningCars);
router.get('/coupons/car-specific', getCarSpecificCoupons);
router.get('/policies/:key', getPolicyByKey);

export default router;

