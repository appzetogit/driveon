import User from '../models/User.js';
import Booking from '../models/Booking.js';
import GuarantorPoints from '../models/GuarantorPoints.js';
import { sendPushNotification } from '../services/firebase.service.js';

/**
 * Process referral signup completion
 * Awards points to the referrer when a referred user completes signup (verifies OTP)
 * 
 * @param {string} userId - The ID of the user who completed signup
 * @returns {Promise<void>}
 */
export const processReferralSignup = async (userId) => {
  try {
    if (!userId) {
      console.log('⚠️ No userId provided for referral signup');
      return;
    }

    // Find the user who completed signup
    const user = await User.findById(userId);
    if (!user) {
      console.log(`⚠️ User not found: ${userId}`);
      return;
    }

    // Check if points already awarded for signup
    if (user.referralSignupPointsAwarded) {
      console.log(`ℹ️ Referral signup points already awarded for user ${userId}, skipping`);
      return;
    }

    // Find the referrer
    const referrer = await User.findById(user.referredBy);
    if (!referrer) {
      console.log(`⚠️ Referrer not found: ${user.referredBy}`);
      return;
    }

    // Award points for signup (50 points as per frontend expectations)
    const pointsForSignup = 50;
    referrer.points = (referrer.points || 0) + pointsForSignup;
    referrer.totalPointsEarned = (referrer.totalPointsEarned || 0) + pointsForSignup;
    await referrer.save();

    // Mark that signup points have been awarded on the referred user
    user.referralSignupPointsAwarded = true;
    await user.save();

    // Send Push Notification to Referrer
    try {
      const notificationTitle = "Referral Bonus Earned! 🎉";
      const notificationBody = `You earned ${pointsForSignup} points! Your friend ${user.name || 'a new user'} just signed up using your referral code.`;
      
      const payload = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          type: 'referral_bonus',
          points: pointsForSignup.toString(),
          source: 'signup',
          referredUserId: user._id.toString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      };

      // Send to both Web and Mobile
      // We use fire-and-forget to not block the process
      sendPushNotification(referrer._id, payload, false).catch(err => console.error('Error sending referral web notification:', err));
      sendPushNotification(referrer._id, payload, true).catch(err => console.error('Error sending referral mobile notification:', err));
      
      console.log(`📣 Sent referral signup notification to ${referrer._id}`);
    } catch (notifError) {
      console.error('Error sending referral notification:', notifError);
    }

    console.log(`✅ Referral signup processed:`);
    console.log(`   - User: ${user.name || user.email} (${userId})`);
    console.log(`   - Referrer: ${referrer.name || referrer.email} (${user.referredBy})`);
    console.log(`   - Points awarded: ${pointsForSignup}`);
    console.log(`   - Referrer total points: ${referrer.points}`);
  } catch (error) {
    console.error('❌ Error processing referral signup:', error);
    // Don't throw error - we don't want to fail the signup if referral processing fails
    // Just log the error and return
  }
};

/**
 * Process referral trip completion
 * Awards points to the referrer when a referred user completes their first trip
 * 
 * @param {string} userId - The ID of the user who completed the trip
 * @returns {Promise<void>}
 */
export const processReferralTripCompletion = async (userId) => {
  try {
    if (!userId) {
      console.log('⚠️ No userId provided for referral trip completion');
      return;
    }

    // Find the user who completed the trip
    const user = await User.findById(userId);
    if (!user) {
      console.log(`⚠️ User not found: ${userId}`);
      return;
    }

    // Check if points already awarded for trip completion
    if (user.referralTripPointsAwarded) {
      console.log(`ℹ️ Referral trip points already awarded for user ${userId}, skipping`);
      return;
    }

    // Find the referrer
    const referrer = await User.findById(user.referredBy);
    if (!referrer) {
      console.log(`⚠️ Referrer not found: ${user.referredBy}`);
      return;
    }

    // Award points for trip completion (50 points as per frontend expectations)
    const pointsForTrip = 50;
    referrer.points = (referrer.points || 0) + pointsForTrip;
    referrer.totalPointsEarned = (referrer.totalPointsEarned || 0) + pointsForTrip;
    await referrer.save();

    // Mark that trip points have been awarded on the referred user
    user.referralTripPointsAwarded = true;
    await user.save();

    // Send Push Notification to Referrer
    try {
      const notificationTitle = "Referral Bonus Earned! 🚗";
      const notificationBody = `You earned ${pointsForTrip} points! Your friend ${user.name || 'a new user'} completed their first trip.`;
      
      const payload = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          type: 'referral_bonus',
          points: pointsForTrip.toString(),
          source: 'trip_completion',
          referredUserId: user._id.toString(),
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      };

      // Send to both Web and Mobile
      sendPushNotification(referrer._id, payload, false).catch(err => console.error('Error sending referral web notification:', err));
      sendPushNotification(referrer._id, payload, true).catch(err => console.error('Error sending referral mobile notification:', err));
      
      console.log(`📣 Sent referral trip completion notification to ${referrer._id}`);
    } catch (notifError) {
      console.error('Error sending referral notification:', notifError);
    }

    console.log(`✅ Referral trip completion processed:`);
    console.log(`   - User: ${user.name || user.email} (${userId})`);
    console.log(`   - Referrer: ${referrer.name || referrer.email} (${user.referredBy})`);
    console.log(`   - Points awarded: ${pointsForTrip}`);
    console.log(`   - Referrer total points: ${referrer.points}`);
  } catch (error) {
    console.error('❌ Error processing referral trip completion:', error);
    // Don't throw error - we don't want to fail the booking completion if referral processing fails
    // Just log the error and return
  }
};

/**
 * @desc    Get user's referral dashboard data
 * @route   GET /api/referrals/dashboard
 * @access  Private
 */
export const getReferralDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's referral code and points
    const user = await User.findById(userId).select('referralCode points totalPointsEarned totalPointsUsed');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get all users referred by this user
    const referredUsers = await User.find({ referredBy: userId })
      .select('name email createdAt referralPointsAdjustment')
      .sort({ createdAt: -1 });

    // Calculate statistics for each referred user
    const referrals = await Promise.all(
      referredUsers.map(async (referredUser) => {
        // Count completed trips
        const tripsCompleted = await Booking.countDocuments({
          user: referredUser._id,
          status: 'completed',
        });

        // Calculate points earned from this referral
        // 50 points for signup + 50 points for first completed trip + admin adjustment
        let pointsEarned = 50 + (referredUser.referralPointsAdjustment || 0); // Signup points + adjustment
        if (tripsCompleted > 0) {
          pointsEarned += 50; // First trip completion points
        }

        // Determine status: active if has completed trips, pending otherwise
        const status = tripsCompleted > 0 ? 'active' : 'pending';

        return {
          id: referredUser._id,
          name: referredUser.name || referredUser.email.split('@')[0],
          email: referredUser.email,
          signupDate: referredUser.createdAt,
          tripsCompleted,
          pointsEarned,
          status,
        };
      })
    );

    // Calculate total statistics
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.status === 'active').length;
    const totalPointsFromReferrals = referrals.reduce((sum, r) => sum + r.pointsEarned, 0);

    // Recalculate exact total points from both referral and guarantor points
    // This ensures exact decimals are shown (10.5 instead of 11)
    let exactTotalPoints = totalPointsFromReferrals; // Start with referral points
    
    // Add exact guarantor points (recalculate from records to avoid rounding)
    const guarantorPointsRecords = await GuarantorPoints.find({
      guarantor: userId,
      status: 'active',
    });
    
    const exactGuarantorPoints = guarantorPointsRecords.reduce((sum, r) => {
      // Recalculate exact points from booking amount to avoid rounding issues
      const exactTotalPool = r.bookingAmount * 0.1; // 10% of booking amount (exact)
      const exactPointsPerGuarantor = exactTotalPool / r.totalGuarantors; // Exact division
      return sum + exactPointsPerGuarantor;
    }, 0);
    
    // Total points = referral points + guarantor points (both exact decimals)
    exactTotalPoints = totalPointsFromReferrals + exactGuarantorPoints;

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode || '',
        points: exactTotalPoints, // Use recalculated exact value instead of user.points (might be rounded)
        totalPointsEarned: user.totalPointsEarned || 0,
        totalPointsUsed: user.totalPointsUsed || 0,
        referrals,
        statistics: {
          totalReferrals,
          activeReferrals,
          totalPointsFromReferrals,
        },
      },
    });
  } catch (error) {
    console.error('Get referral dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching referral dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get user's referrals list
 * @route   GET /api/referrals
 * @access  Private
 */
export const getMyReferrals = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all users referred by this user
    const referredUsers = await User.find({ referredBy: userId })
      .select('name email createdAt referralPointsAdjustment')
      .sort({ createdAt: -1 });

    // Calculate statistics for each referred user
    const referrals = await Promise.all(
      referredUsers.map(async (referredUser) => {
        // Count completed trips
        const tripsCompleted = await Booking.countDocuments({
          user: referredUser._id,
          status: 'completed',
        });

        // Calculate points earned from this referral
        let pointsEarned = 50 + (referredUser.referralPointsAdjustment || 0); // Signup points + adjustment
        if (tripsCompleted > 0) {
          pointsEarned += 50; // First trip completion points
        }

        // Determine status
        const status = tripsCompleted > 0 ? 'active' : 'pending';

        return {
          id: referredUser._id,
          name: referredUser.name || referredUser.email.split('@')[0],
          email: referredUser.email,
          signupDate: referredUser.createdAt,
          tripsCompleted,
          pointsEarned,
          status,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        referrals,
      },
    });
  } catch (error) {
    console.error('Get my referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching referrals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

