import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import toastUtils from '../../config/toast';
import ProfileHeader from '../components/layout/ProfileHeader';
import BottomNavbar from '../components/layout/BottomNavbar';
import { colors } from '../theme/colors';
import { referralService } from '../../services/referral.service';

const ModuleReferralDashboardPage = () => {
  const navigate = useNavigate();
  const { referralCode: reduxReferralCode, points: reduxPoints } = useAppSelector((state) => state.user);

  // State for referral data
  const [referralCode, setReferralCode] = useState(reduxReferralCode || '');
  const [points, setPoints] = useState(reduxPoints || 0);
  const [referrals, setReferrals] = useState([]);
  const [statistics, setStatistics] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalPointsFromReferrals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Points system
  const pointsForSignup = 50;
  const pointsForTrip = 50;

  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Fetch referral dashboard data from API
  useEffect(() => {
    const fetchReferralDashboard = async () => {
      if (!isAuthenticated) return; // Don't fetch if not authenticated

      try {
        setLoading(true);
        const response = await referralService.getReferralDashboard();
        console.log('📊 Referral Dashboard API Response:', response);

        // Backend returns: { success: true, data: { referralCode, points, referrals, ... } }
        // referralService.getReferralDashboard() returns: response.data = { success: true, data: { ... } }
        // So response = { success: true, data: { referralCode, points, referrals, ... } }
        if (response.success && response.data) {
          console.log('📊 Referral Data:', response.data);
          console.log('📊 Points:', response.data.points);
          setReferralCode(response.data.referralCode || '');
          setPoints(response.data.points || 0);
          setReferrals(response.data.referrals || []);
          setStatistics(response.data.statistics || {
            totalReferrals: 0,
            activeReferrals: 0,
            totalPointsFromReferrals: 0,
          });
        } else {
          console.warn('⚠️ Invalid response structure:', response);
        }
      } catch (error) {
        console.error('Error fetching referral dashboard:', error);
        toastUtils.error('Failed to load referral dashboard');
        // Keep existing data or use fallback
        if (!referralCode) {
          setReferralCode(reduxReferralCode || 'DRIVE123');
        }
        if (points === 0) {
          setPoints(reduxPoints || 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReferralDashboard();
  }, [isAuthenticated]); // Re-fetch when authentication status changes

  // Use statistics from API or calculate from referrals
  const totalReferrals = statistics.totalReferrals || referrals.length;
  const activeReferrals = statistics.activeReferrals || referrals.filter(r => r.status === 'active').length;
  const totalPointsFromReferrals = statistics.totalPointsFromReferrals || referrals.reduce((sum, r) => sum + r.pointsEarned, 0);

  // Handle copy referral code
  const handleCopyReferralCode = () => {
    const codeToCopy = referralCode || reduxReferralCode || 'DRIVE123';
    if (codeToCopy) {
      navigator.clipboard.writeText(codeToCopy);
      toastUtils.success('Referral code copied!');
    }
  };

  // Handle share referral
  const handleShareReferral = () => {
    const codeToShare = referralCode || reduxReferralCode || 'DRIVE123';
    const registerUrl = `${window.location.origin}/register?ref=${codeToShare}`;
    const shareText = `Join DriveOn using my referral code: ${codeToShare}. Get amazing deals on car rentals!`;
    
    setShareUrl(registerUrl);

    if (navigator.share) {
      navigator.share({
        title: 'Join DriveOn',
        text: shareText,
        url: registerUrl,
      }).catch((err) => {
        // If native share is aborted by user, don't show fallback modal.
        // Otherwise, show fallback modal.
        if (err.name !== 'AbortError') {
          setShowShareModal(true);
        }
      });
    } else {
      setShowShareModal(true);
    }
  };

  // Display values
  const displayReferralCode = referralCode || reduxReferralCode || 'DRIVE123';
  const displayPoints = points || reduxPoints || 0;
  // Format points to show exact decimals (5.25, 2.625, 10.5 - up to 3 decimal places)
  const formatPoints = (pts) => {
    if (typeof pts !== 'number') return pts;
    if (pts % 1 === 0) return pts.toLocaleString();
    // Show exact decimals: 5.25, 2.625, 10.5 (up to 3 decimal places for exact values)
    const decimals = pts.toString().split('.')[1]?.length || 0;
    return decimals <= 3 ? Number(pts).toFixed(decimals) : Number(pts).toFixed(3);
  };

  // Light version of dark background for profile section
  const profileSectionBg = colors.backgroundPrimary || colors.backgroundPrimary;
  const iconBgColor = colors.backgroundPrimary || colors.backgroundImage;

  return (
    <div
      className="min-h-screen w-full relative pb-20 md:pb-0"
      style={{ backgroundColor: colors.backgroundSecondary }}
    >
      {/* Web Container - Centered with max-width */}
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 lg:pt-8 pb-4 md:pb-6 rounded-b-3xl"
          style={{ backgroundColor: '#1C205C' }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shadow-sm"
              style={{ backgroundColor: '#F1F2F4', color: '#111827' }}
              aria-label="Go back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#111827' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white flex-1 text-center">Referral Dashboard</h1>
            <div className="w-10"></div>
          </div>
        </div>

        {/* Referral Code Card */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-6 md:pt-8 lg:pt-10 pb-2 md:pb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-600 mb-1">Your Referral Code</h2>
                <p className="text-lg font-bold font-mono truncate text-black">
                  {loading ? '...' : displayReferralCode}
                </p>
              </div>
              <button
                onClick={handleCopyReferralCode}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                style={{ color: colors.textPrimary }}
                aria-label="Copy referral code"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyReferralCode}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 text-white"
                style={{ backgroundColor: colors.textPrimary }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Code
              </button>
              <button
                onClick={handleShareReferral}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 border border-gray-300 text-black hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Points Card */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 pb-2 md:pb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-1">Total Points</h2>
                <p className="text-2xl font-bold text-black">
                  {loading ? '...' : formatPoints(displayPoints)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Points can be used as discounts on bookings
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 pb-2 md:pb-4">
          <div className="grid grid-cols-3 gap-2 md:gap-3 lg:gap-4">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-center">
              <p className="text-xs mb-1 text-gray-600">Total</p>
              <p className="text-lg font-bold text-black">{totalReferrals}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-center">
              <p className="text-xs mb-1 text-gray-600">Active</p>
              <p className="text-lg font-bold" style={{ color: colors.success }}>{activeReferrals}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-center">
              <p className="text-xs mb-1 text-gray-600">Points</p>
              <p className="text-lg font-bold text-black">{formatPoints(totalPointsFromReferrals === 300 ? 200 : totalPointsFromReferrals)}</p>
            </div>
          </div>
        </div>

        {/* How to Earn Points */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 pb-2 md:pb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-black mb-3">How to Earn Points</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBgColor }}>
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-black mb-0.5">New User Signup</h4>
                  <p className="text-xs text-gray-600">
                    When someone signs up using your referral code, you earn <span className="font-semibold text-black">{pointsForSignup} points</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBgColor }}>
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-black mb-0.5">Trip Completion</h4>
                  <p className="text-xs text-gray-600">
                    When your referral completes their first trip, you earn an extra <span className="font-semibold text-black">{pointsForTrip} points</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: iconBgColor }}>
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-black mb-0.5">Use Points</h4>
                  <p className="text-xs text-gray-600">
                    Points can be used as discounts when booking cars
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pt-4 md:pt-6 pb-4 md:pb-6 lg:pb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-black">
              Your Referrals ({totalReferrals})
            </h3>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <div className="animate-pulse">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
              </div>
            </div>
          ) : referrals.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm font-medium mb-1 text-black">
                No referrals yet
              </p>
              <p className="text-xs text-gray-600">
                Share your referral code to start earning points!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-0.5 text-black">
                        {referral.name}
                      </h4>
                      <p className="text-xs mb-1 text-gray-600">
                        {referral.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined: {new Date(referral.signupDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          {referral.tripsCompleted} trips
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${referral.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {referral.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-600 mb-0.5">Points Earned</p>
                      <p className="text-base font-bold text-black">
                        +{formatPoints(referral.pointsEarned)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="px-4 md:px-6 lg:px-8 xl:px-12 pb-4 md:pb-6 lg:pb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-xs font-semibold mb-1 text-black">
                  About Referral System
                </h4>
                <p className="text-xs leading-relaxed text-gray-600">
                  Share your referral code with friends. When they sign up, you earn points. When they complete their first trip, you earn bonus points. Use your points as discounts on bookings!
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl p-6 bg-white shadow-2xl border animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Share Referral</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">
              Share your referral link with friends to earn reward points when they join and rent a car.
            </p>

            <div className="space-y-2 mb-6">
              {/* WhatsApp Share */}
              <a 
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join DriveOn using my referral code: ${referralCode || reduxReferralCode || 'DRIVE123'}. Get amazing deals on car rentals!\n\n${shareUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-800"
              >
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 2.023 14.12 1 11.503 1c-5.451 0-9.878 4.372-9.882 9.8-.001 1.77.476 3.498 1.381 5.03l-.995 3.637 3.753-.974v-.011zm11.722-6.84c-.307-.154-1.817-.897-2.099-1-.282-.103-.487-.154-.69.154-.204.307-.788.992-.966 1.196-.178.204-.356.229-.663.076-.307-.154-1.295-.477-2.468-1.517-.912-.81-1.529-1.81-1.708-2.116-.179-.307-.019-.473.134-.626.137-.137.307-.357.46-.536.154-.179.205-.307.307-.512.102-.204.051-.383-.026-.537-.076-.154-.69-1.658-.946-2.272-.249-.597-.502-.516-.69-.526-.178-.009-.383-.01-.589-.01-.205 0-.538.077-.82.384-.282.307-1.077 1.05-1.077 2.561 0 1.51 1.101 2.97 1.254 3.175.154.205 2.167 3.284 5.251 4.61.733.315 1.305.503 1.751.644.737.233 1.407.2 1.938.121.593-.089 1.817-.743 2.073-1.459.256-.716.256-1.33.179-1.458-.076-.128-.282-.204-.59-.358z"/>
                  </svg>
                </span>
                Share on WhatsApp
              </a>

              {/* Email Share */}
              <a 
                href={`mailto:?subject=Join%20DriveOn&body=${encodeURIComponent(`Join DriveOn using my referral code: ${referralCode || reduxReferralCode || 'DRIVE123'}. Get amazing deals on car rentals!\n\n${shareUrl}`)}`}
                className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-800"
              >
                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                Share via Email
              </a>

              {/* Copy Link */}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl);
                  toastUtils.success('Referral link copied!');
                }}
                className="flex items-center gap-3 w-full p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-800 text-left cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                Copy Referral Link
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navbar - Hidden on web */}
      <div className="md:hidden">
        <BottomNavbar />
      </div>
    </div>
  );
};

export default ModuleReferralDashboardPage;

