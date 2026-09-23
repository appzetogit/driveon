import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commonService } from '../../../services/common.service';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../../config/api';

const CouponCarBanner = ({ onDataAvailability }) => {
    const navigate = useNavigate();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const data = await commonService.getCarSpecificCoupons();
                console.log('Coupon API Response:', data);
                if (data.success && data.data && data.data.coupons) {
                    // Filter only valid coupons that have car data
                    const validCoupons = data.data.coupons.filter(c => c.cars && c.cars.length > 0 && c.cars[0] && c.cars[0].brand);
                    setCoupons(validCoupons);
                    if (onDataAvailability && validCoupons.length > 0) {
                        onDataAvailability(true);
                    }
                }
            } catch (error) {
                console.error('Error fetching car specific coupons:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCoupons();
    }, [onDataAvailability]);

    if (loading || coupons.length === 0) return null;

    return (
        <div className="mb-6 w-full">
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-200">
                    Exclusive Offers
                </span>
                <h2 className="text-lg font-bold text-gray-800">
                    Limited Time Deals
                </h2>
            </div>

            <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide -mx-0">
                <AnimatePresence>
                    {coupons.map((coupon, index) => {
                        // For simplicity, handle the first car associated with the coupon for the banner image
                        // If multiple cars, we could show a generic image or the first one.
                        const car = coupon.cars[0];

                        return (
                            <motion.div
                                key={coupon._id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex-shrink-0 relative w-[300px] md:w-[350px] h-[160px] md:h-[180px] rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
                                style={{
                                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%)'
                                }}
                                onClick={() => {
                                    const carId = car._id || car.id;
                                    if (carId) {
                                        navigate(`/car-details/${carId}`);
                                    } else {
                                        navigate('/search');
                                    }
                                }}
                            >
                                {/* Background Pattern/Accents */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

                                <div className="absolute inset-0 flex flex-row p-4 md:p-5 relative z-10">
                                    {/* Text Content */}
                                    <div className="flex-1 flex flex-col justify-center z-10 pr-2">
                                        <div className="inline-block px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 mb-2 w-fit">
                                            <span className="text-xs font-bold text-yellow-400 tracking-wider">
                                                {coupon.code}
                                            </span>
                                        </div>

                                        <h3 className="text-white font-bold text-xl md:text-2xl leading-tight mb-1">
                                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                        </h3>
                                        <p className="text-gray-300 text-xs md:text-sm line-clamp-2 mb-3">
                                            On {car.brand} {car.model}
                                        </p>

                                        <button className="bg-white text-gray-900 text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-gray-100 transition-colors w-fit active:scale-95">
                                            Book Now
                                        </button>
                                    </div>

                                    {/* Car Image */}
                                    <div className="w-[140px] md:w-[160px] h-full flex items-center justify-center relative">
                                        {/* Glow behind car */}
                                        <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>

                                        <img
                                            src={(() => {
                                                if (car.images && car.images.length > 0) {
                                                    const img = car.images[0];
                                                    // If object (legacy), get url property
                                                    const src = typeof img === 'object' ? (img.url || img.path) : img;

                                                    if (!src) return '/placeholder-car.png';
                                                    if (src.startsWith('http') || src.startsWith('data:')) return src;

                                                    // Prepend base URL for relative paths
                                                    const base = API_BASE_URL || 'http://localhost:5000';
                                                    return `${base}${src.startsWith('/') ? '' : '/'}${src}`;
                                                }
                                                return '/placeholder-car.png';
                                            })()}
                                            alt={`${car.brand} ${car.model}`}
                                            className="w-full h-auto object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CouponCarBanner;
