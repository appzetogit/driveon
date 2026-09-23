import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { theme } from '../../theme/theme.constants';
import toastUtils from '../../config/toast';
import { referralService } from '../../services/referral.service';

/**
 * ReferralDashboardPage Component
 * Referral dashboard showing referral code, points, and referral history
 * Based on document.txt - Every user gets referral code, points for signups and trip completions, points usable as discounts
 */
const ReferralDashboardPage = () => {
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

  // Fetch referral dashboard data from API
  useEffect(() => {
    const fetchReferralDashboard = async () => {
      try {
        setLoading(true);
        const response = await referralService.getReferralDashboard();
        
        if (response.success && response.data) {
          setReferralCode(response.data.referralCode || '');
          setPoints(response.data.points || 0);
          setReferrals(response.data.referrals || []);
          setStatistics(response.data.statistics || {
            totalReferrals: 0,
            activeReferrals: 0,
            totalPointsFromReferrals: 0,
          });
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
  }, []);

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

  // Use statistics from API or calculate from referrals
  const totalReferrals = statistics.totalReferrals || referrals.length;
  const activeReferrals = statistics.activeReferrals || referrals.filter(ref => ref.status === 'active').length;
  const totalPointsFromReferrals = statistics.totalPointsFromReferrals || referrals.reduce((sum, ref) => sum + ref.pointsEarned, 0);

  // Display referral code
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

  return (
    <div className="min-h-screen pb-24 bg-gray-50">
      {/* Header */}
      <header className="text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>
        <div className="relative px-4 pt-3 pb-3 md:px-6 md:py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors md:p-2"
                aria-label="Go back"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg md:text-2xl font-bold text-white">Referral Dashboard</h1>
              <div className="w-8"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Points Summary Card */}
      <div className="px-4 pt-6 pb-2 md:pt-8 md:pb-2">
        <div className="max-w-7xl mx-auto">
          <div 
            className="rounded-xl p-4 md:p-6 shadow-lg text-white"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)`,
            }}
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div>
                <p className="text-xs md:text-sm text-white/80 mb-1 md:mb-2">Total Points</p>
                <h2 className="text-3xl md:text-5xl font-bold">{loading ? '...' : formatPoints(displayPoints)}</h2>
              </div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-xs md:text-sm text-white/70">
              Use points to get discounts on bookings
            </p>
          </div>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="px-4 pt-2 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border" style={{ borderColor: theme.colors.borderLight }}>
            <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}15` }}>
                <svg className="w-5 h-5 md:w-6 md:h-6" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm md:text-lg font-semibold mb-0.5" style={{ color: theme.colors.textPrimary }}>
                  Your Referral Code
                </h3>
                <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
                  Share this code to earn points
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <div className="flex-1 px-4 py-3 md:py-4 rounded-lg bg-gray-50 border-2 border-dashed" style={{ borderColor: theme.colors.primary }}>
                <p className="text-lg md:text-2xl font-bold text-center font-mono" style={{ color: theme.colors.primary }}>
                  {displayReferralCode}
                </p>
              </div>
              <button
                onClick={handleCopyReferralCode}
                className="px-4 py-3 md:px-6 md:py-4 rounded-lg font-semibold text-sm md:text-base transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.white,
                }}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
            </div>

            <button
              onClick={handleShareReferral}
              className="w-full py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              style={{
                backgroundColor: `${theme.colors.primary}15`,
                color: theme.colors.primary,
              }}
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Referral Code
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-4 pt-2 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border text-center hover:shadow-md transition-shadow" style={{ borderColor: theme.colors.borderLight }}>
              <p className="text-xs md:text-sm mb-1 md:mb-2" style={{ color: theme.colors.textSecondary }}>Total</p>
              <p className="text-lg md:text-2xl font-bold" style={{ color: theme.colors.primary }}>{totalReferrals}</p>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border text-center hover:shadow-md transition-shadow" style={{ borderColor: theme.colors.borderLight }}>
              <p className="text-xs md:text-sm mb-1 md:mb-2" style={{ color: theme.colors.textSecondary }}>Active</p>
              <p className="text-lg md:text-2xl font-bold" style={{ color: theme.colors.success }}>{activeReferrals}</p>
            </div>
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border text-center hover:shadow-md transition-shadow" style={{ borderColor: theme.colors.borderLight }}>
              <p className="text-xs md:text-sm mb-1 md:mb-2" style={{ color: theme.colors.textSecondary }}>Points</p>
              <p className="text-lg md:text-2xl font-bold" style={{ color: theme.colors.primary }}>{formatPoints(totalPointsFromReferrals)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Earn Points */}
      <div className="px-4 pt-2 pb-2">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-md border" style={{ borderColor: theme.colors.borderLight }}>
            <h3 className="text-sm md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2" style={{ color: theme.colors.primary }}>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              How to Earn Points
            </h3>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start gap-3 md:gap-4 p-2.5 md:p-4 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}08` }}>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs md:text-sm font-bold text-white" style={{ backgroundColor: theme.colors.primary }}>
                  1
                </div>
                <div className="flex-1">
                  <p className="text-xs md:text-base font-semibold mb-0.5 md:mb-1" style={{ color: theme.colors.textPrimary }}>
                    Friend Signs Up
                  </p>
                  <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
                    Earn <span className="font-bold" style={{ color: theme.colors.primary }}>{pointsForSignup} points</span> when someone uses your code to register
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:gap-4 p-2.5 md:p-4 rounded-lg" style={{ backgroundColor: `${theme.colors.primary}08` }}>
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs md:text-sm font-bold text-white" style={{ backgroundColor: theme.colors.primary }}>
                  2
                </div>
                <div className="flex-1">
                  <p className="text-xs md:text-base font-semibold mb-0.5 md:mb-1" style={{ color: theme.colors.textPrimary }}>
                    Friend Completes Trip
                  </p>
                  <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
                    Earn <span className="font-bold" style={{ color: theme.colors.primary }}>{pointsForTrip} points</span> for each completed trip by your referrals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Points Usage Info */}
      <div className="px-4 pt-2 pb-2">
        <div className="max-w-7xl mx-auto">
          <div 
            className="rounded-xl p-4 md:p-6 border-2" 
            style={{ 
              borderColor: `${theme.colors.primary}40`,
              background: `linear-gradient(135deg, ${theme.colors.primary}08 0%, ${theme.colors.primary}15 100%)`,
            }}
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <svg className="w-5 h-5 md:w-6 md:h-6" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm md:text-lg font-bold mb-1 md:mb-2" style={{ color: theme.colors.primary }}>
                  Use Points for Discounts
                </h4>
                <p className="text-xs md:text-sm leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  Redeem your points during checkout to get discounts on car rentals. <span className="font-semibold">100 points = ₹50 discount</span>. Points never expire!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="px-4 pt-2 pb-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-sm md:text-lg font-semibold" style={{ color: theme.colors.primary }}>
              Your Referrals ({totalReferrals})
            </h3>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
              <div className="animate-pulse">
                <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
              </div>
            </div>
          ) : referrals.length === 0 ? (
            <div className="bg-white rounded-xl p-6 md:p-8 text-center shadow-sm border" style={{ borderColor: theme.colors.borderLight }}>
              <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4" style={{ color: theme.colors.textTertiary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-sm md:text-base font-medium mb-1" style={{ color: theme.colors.textPrimary }}>
                No referrals yet
              </p>
              <p className="text-xs md:text-sm" style={{ color: theme.colors.textSecondary }}>
                Share your referral code to start earning points!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="bg-white rounded-lg p-3 md:p-4 shadow-sm border hover:shadow-md transition-shadow"
                  style={{ borderColor: theme.colors.borderLight }}
                >
                  <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex-1">
                      <h4 className="text-sm md:text-base font-semibold mb-0.5 md:mb-1" style={{ color: theme.colors.textPrimary }}>
                        {referral.name}
                      </h4>
                      <p className="text-xs md:text-sm mb-1" style={{ color: theme.colors.textSecondary }}>
                        {referral.email}
                      </p>
                      <div className="flex items-center gap-2 md:gap-3 mt-1.5 md:mt-2">
                        <span className="text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1 rounded-md" style={{ backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary }}>
                          {referral.tripsCompleted} trips
                        </span>
                        <span className={`text-xs md:text-sm px-2 py-0.5 md:px-3 md:py-1 rounded-md ${
                          referral.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {referral.status === 'active' ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs md:text-sm mb-0.5" style={{ color: theme.colors.textSecondary }}>
                        Points Earned
                      </p>
                      <p className="text-base md:text-xl font-bold" style={{ color: theme.colors.primary }}>
                        +{formatPoints(referral.pointsEarned)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm mt-2 md:mt-3 pt-2 md:pt-3 border-t" style={{ color: theme.colors.textTertiary, borderColor: theme.colors.borderLight }}>
                    Joined on {new Date(referral.signupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default ReferralDashboardPage;
