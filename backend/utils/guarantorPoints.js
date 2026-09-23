import GuarantorPoints from '../models/GuarantorPoints.js';
import User from '../models/User.js';

/**
 * Reverse guarantor points for a cancelled booking
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Reason for reversal
 * @returns {Promise<void>}
 */
export const reverseGuarantorPoints = async (bookingId, reason = 'Booking cancelled') => {
  try {
    console.log('🔄 Reversing guarantor points for booking:', bookingId);

    // Find all active points records for this booking
    const activePoints = await GuarantorPoints.find({
      booking: bookingId,
      status: 'active',
    }).populate('guarantor', 'name email');

    if (activePoints.length === 0) {
      console.log('ℹ️ No active points found for this booking');
      return;
    }

    console.log(`📊 Found ${activePoints.length} active points records to reverse`);

    // Reverse points for each guarantor
    for (const pointsRecord of activePoints) {
      // Recalculate exact points from booking amount to ensure exact decimals (no rounding)
      const exactTotalPool = pointsRecord.bookingAmount * 0.1; // 10% of booking amount (exact)
      const exactPointsPerGuarantor = exactTotalPool / pointsRecord.totalGuarantors; // Exact division
      const pointsToReverse = exactPointsPerGuarantor; // Use recalculated exact value instead of stored rounded value
      const guarantorId = pointsRecord.guarantor._id || pointsRecord.guarantor;

      // Update points record status
      pointsRecord.status = 'reversed';
      pointsRecord.reversedAt = new Date();
      pointsRecord.reversalReason = reason;
      await pointsRecord.save();

      // Deduct points from guarantor's balance
      const guarantorUser = await User.findById(guarantorId);
      if (guarantorUser) {
        const oldBalance = guarantorUser.points || 0;
        const newBalance = Math.max(0, oldBalance - pointsToReverse); // Ensure balance doesn't go negative
        
        guarantorUser.points = newBalance;
        await guarantorUser.save();

        console.log('✅ Points reversed:', {
          guarantorId: guarantorId.toString(),
          guarantorName: guarantorUser.name || guarantorUser.email,
          pointsReversed: pointsToReverse,
          oldBalance,
          newBalance,
        });
      }
    }

    console.log('✅ All guarantor points reversed successfully');
  } catch (error) {
    console.error('❌ Error reversing guarantor points:', error);
    // Don't throw - we don't want to fail booking cancellation if points reversal fails
  }
};

/**
 * Refund points used for booking discount when the booking is cancelled
 * @param {object} booking - Booking document
 * @returns {Promise<void>}
 */
export const refundUsedBookingPoints = async (booking) => {
  try {
    const pointsUsed = booking.pricing?.pointsUsed || 0;
    if (pointsUsed <= 0) return;

    console.log(`🔄 Refunding ${pointsUsed} points to user ${booking.user} for cancelled booking ${booking._id}`);

    const user = await User.findById(booking.user);
    if (user) {
      const oldPoints = user.points || 0;
      user.points = oldPoints + pointsUsed;
      user.totalPointsUsed = Math.max(0, (user.totalPointsUsed || 0) - pointsUsed);
      await user.save();
      console.log(`✅ Refunded ${pointsUsed} points to user. Old balance: ${oldPoints}, New balance: ${user.points}`);
    } else {
      console.error(`❌ User not found for refunding points: ${booking.user}`);
    }
  } catch (error) {
    console.error('❌ Error refunding used booking points:', error);
  }
};

