import { useNavigate } from 'react-router-dom';
import { theme } from '../theme/theme.constants';

/**
 * TermsAndConditionsPage Component
 * Comprehensive Terms and Conditions page for DriveOn Car Rental App
 * Based on document.txt - covers all features: KYC, Guarantor, Booking, Tracking, Payments, etc.
 */
const TermsAndConditionsPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      id: 'acceptance',
      title: '1. Acceptance of Terms',
      content: `By accessing and using the DriveOn car rental platform ("Platform", "Service", "we", "us", or "our"), you accept and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not use our Service.

These Terms apply to all users of the Platform, including renters, car owners, guarantors, and visitors.`,
    },
    {
      id: 'eligibility',
      title: '2. Eligibility and Account Registration',
      content: `2.1 To use our Service, you must:
- Be at least 18 years of age
- Have a valid driving license
- Complete 100% profile completion including all mandatory fields
- Complete KYC verification via DigiLocker
- Provide accurate and complete information

2.2 Account Registration:
- You must register using a valid email address and phone number
- OTP verification is required for account activation
- You are responsible for maintaining the confidentiality of your account credentials
- You agree to notify us immediately of any unauthorized use of your account`,
    },
    {
      id: 'profile-kyc',
      title: '3. Profile Completion and KYC Verification',
      content: `3.1 Mandatory Profile Fields:
- Full Name
- Email Address
- Phone Number
- Age
- Gender
- Complete Address
- Profile Photo
- Aadhaar (via DigiLocker)
- PAN (via DigiLocker)
- Driving License (via DigiLocker)

3.2 KYC Verification:
- All users must complete KYC verification through DigiLocker OAuth2 integration
- We will fetch verified documents (Aadhaar, DL, PAN) from DigiLocker
- Booking is not allowed until KYC is verified and approved
- You agree to provide accurate and authentic documents
- Falsification of documents will result in immediate account termination and legal action`,
    },
    {
      id: 'guarantor',
      title: '4. Guarantor System',
      content: `4.1 Guarantor Requirement:
- Users must add a guarantor before making a booking
- Guarantor must be a separate individual with their own account
- Guarantor must complete registration and KYC verification
- Booking is not allowed until guarantor is verified and linked

4.2 Guarantor Responsibilities:
- Guarantor agrees to be financially responsible for any damages, losses, or violations
- Guarantor must complete their own KYC verification
- Guarantor will receive notifications about the booking status

4.3 User-Guarantor Relationship:
- Users and guarantors are linked in our database
- Both parties must maintain active and verified accounts
- Any changes to guarantor status must be updated immediately`,
    },
    {
      id: 'booking',
      title: '5. Car Rental and Booking',
      content: `5.1 Booking Requirements:
- Complete profile (100%)
- Verified KYC
- Verified Guarantor
- Valid driving license
- Payment (Full or 20% advance)

5.2 Booking Process:
- Select car from available listings
- Choose pickup and drop-off date & time
- Review dynamic pricing (based on date, time, duration, demand)
- Select payment option (Full Payment or 20% Advance Payment)
- Add guarantor (if not already added)
- Complete payment via Razorpay/Stripe
- Receive booking confirmation

5.3 Dynamic Pricing:
- Prices are calculated dynamically based on:
  * Date of booking (weekday/weekend)
  * Time of booking (peak hours)
  * Duration of rental
  * Seasonal surge
  * Car demand
  * Festive days
- Final price is displayed before payment confirmation
- Prices are subject to change until booking is confirmed`,
    },
    {
      id: 'payment',
      title: '6. Payment Terms',
      content: `6.1 Payment Options:
- Full Payment: Pay the entire rental amount upfront
- 20% Advance Payment: Pay 20% advance, remaining amount auto-debited

6.2 Payment Processing:
- Payments are processed through Razorpay/Stripe
- Security deposit may be required (refundable after trip completion)
- Payment confirmation is required before booking is confirmed
- All payments are in Indian Rupees (INR)

6.3 Refunds and Cancellations:
- Cancellation policy varies based on timing and circumstances
- Refunds (if applicable) will be processed within 7-14 business days
- Security deposits are refunded after vehicle inspection and trip completion
- No refunds for no-shows or late cancellations`,
    },
    {
      id: 'tracking',
      title: '7. Live Location Tracking',
      content: `7.1 Tracking Consent:
- By booking a car, you agree to enable live location tracking during the trip
- Tracking is mandatory for all bookings
- Location data is collected every 10 seconds during active trips
- Tracking is automatically disabled when trip ends

7.2 Tracking Purpose:
- Vehicle security and safety
- Real-time monitoring for car owners and admin
- Emergency assistance
- Dispute resolution
- Compliance with rental agreement

7.3 Data Storage:
- Location data is stored for 6 months
- Data is used only for the purposes stated above
- We comply with all applicable data protection laws`,
    },
    {
      id: 'vehicle-use',
      title: '8. Vehicle Use and Responsibilities',
      content: `8.1 Authorized Use:
- Vehicle may only be driven by the registered renter
- Vehicle must be used in accordance with all traffic laws
- Vehicle must not be used for illegal activities
- Vehicle must not be sublet or transferred to another person

8.2 Renter Responsibilities:
- Return vehicle in the same condition as received (normal wear and tear excepted)
- Report any damages immediately
- Maintain valid insurance coverage
- Pay for all tolls, parking, and traffic violations
- Return vehicle on time at the agreed location
- Keep vehicle clean and in good condition

8.3 Prohibited Uses:
- Racing or competitive driving
- Towing or pushing other vehicles
- Transporting hazardous materials
- Transporting more passengers than vehicle capacity
- Driving under influence of alcohol or drugs
- Using vehicle for commercial purposes without authorization`,
    },
    {
      id: 'damages',
      title: '9. Damages and Liability',
      content: `9.1 Damage Assessment:
- All damages will be assessed by car owner or authorized representative
- Photos and documentation will be collected
- Repair costs will be calculated based on actual repair expenses

9.2 Financial Responsibility:
- Renter is responsible for all damages during rental period
- Security deposit may be used to cover damages
- Additional charges may apply if damages exceed security deposit
- Guarantor is also financially responsible as per guarantor agreement

9.3 Insurance:
- Basic insurance coverage is included
- Additional coverage options may be available
- Renter is responsible for deductible amounts
- Insurance claims are subject to insurance company terms`,
    },
    {
      id: 'reviews',
      title: '10. Reviews and Ratings',
      content: `10.1 Review System:
- Users can rate and review cars after trip completion
- Users can rate trip experience
- Car owners can rate renters
- Reviews must be honest and based on actual experience

10.2 Review Guidelines:
- Reviews must not contain offensive, defamatory, or false information
- We reserve the right to remove inappropriate reviews
- Reviews are subject to moderation
- Fake reviews are prohibited and may result in account suspension`,
    },
    {
      id: 'referral',
      title: '11. Referral Program',
      content: `11.1 Referral System:
- Each user receives a unique referral code
- New users can apply referral code during signup
- Referrer earns points when new user completes first trip
- Points are visible in user profile
- Points can be used as discounts on bookings

11.2 Referral Terms:
- Referral points are non-transferable
- Points expire as per program terms
- Fraudulent referrals will result in account termination
- We reserve the right to modify or terminate referral program at any time`,
    },
    {
      id: 'cancellation',
      title: '12. Cancellation and Refund Policy',
      content: `12.1 Cancellation by Renter:
- Cancellation more than 48 hours before pickup: Full refund (minus processing fees)
- Cancellation 24-48 hours before pickup: 50% refund
- Cancellation less than 24 hours before pickup: No refund
- No-show: No refund

12.2 Cancellation by Car Owner:
- If car owner cancels, full refund will be provided
- Alternative car options may be offered
- We are not liable for any indirect damages due to cancellation

12.3 Refund Processing:
- Refunds are processed within 7-14 business days
- Refunds are credited to the original payment method
- Processing fees (if any) are non-refundable`,
    },
    {
      id: 'prohibited',
      title: '13. Prohibited Activities',
      content: `Users are strictly prohibited from:
- Creating fake accounts or providing false information
- Manipulating pricing or booking system
- Harassing or abusing other users
- Violating any applicable laws or regulations
- Attempting to hack or compromise the Platform
- Using automated systems to access the Platform
- Reselling or subletting bookings
- Any activity that may harm the Platform or other users`,
    },
    {
      id: 'intellectual',
      title: '14. Intellectual Property',
      content: `14.1 Platform Ownership:
- All content, features, and functionality of the Platform are owned by DriveOn
- This includes but is not limited to: logos, designs, text, graphics, software, and code

14.2 User Content:
- Users retain ownership of content they submit
- By submitting content, users grant us license to use, display, and distribute such content
- Users are responsible for ensuring they have rights to submit any content`,
    },
    {
      id: 'privacy',
      title: '15. Privacy and Data Protection',
      content: `15.1 Data Collection:
- We collect personal information as described in our Privacy Policy
- This includes profile information, KYC documents, location data, and payment information

15.2 Data Usage:
- Data is used to provide and improve our Service
- Data may be shared with car owners, guarantors, and service providers as necessary
- We comply with applicable data protection laws

15.3 User Rights:
- Users have the right to access, update, or delete their personal information
- Users can request data portability
- For more details, please refer to our Privacy Policy`,
    },
    {
      id: 'termination',
      title: '16. Account Termination',
      content: `16.1 Termination by User:
- Users may terminate their account at any time
- Active bookings must be completed or cancelled before termination
- Outstanding payments must be settled

16.2 Termination by DriveOn:
- We may suspend or terminate accounts for:
  * Violation of these Terms
  * Fraudulent activity
  * Non-payment
  * Illegal activities
  * Any other reason we deem necessary

16.3 Effect of Termination:
- Access to the Platform will be immediately revoked
- Outstanding obligations remain in effect
- Data may be retained as required by law`,
    },
    {
      id: 'disputes',
      title: '17. Dispute Resolution',
      content: `17.1 Dispute Process:
- Users should first contact our support team
- We will attempt to resolve disputes amicably
- Documentation and evidence may be required

17.2 Arbitration:
- Disputes that cannot be resolved amicably will be resolved through arbitration
- Arbitration will be conducted in accordance with Indian Arbitration laws
- Arbitration location: [City, State], India

17.3 Governing Law:
- These Terms are governed by the laws of India
- Any legal proceedings will be subject to the jurisdiction of courts in [City, State], India`,
    },
    {
      id: 'limitation',
      title: '18. Limitation of Liability',
      content: `18.1 Service Availability:
- We strive to provide uninterrupted service but do not guarantee 100% uptime
- We are not liable for service interruptions due to technical issues, maintenance, or force majeure

18.2 Third-Party Services:
- We are not responsible for third-party services (payment gateways, DigiLocker, etc.)
- Users use third-party services at their own risk

18.3 Maximum Liability:
- Our total liability is limited to the amount paid by the user for the specific booking
- We are not liable for indirect, incidental, or consequential damages`,
    },
    {
      id: 'modifications',
      title: '19. Modifications to Terms',
      content: `19.1 Changes to Terms:
- We reserve the right to modify these Terms at any time
- Material changes will be notified via email or Platform notification
- Continued use of the Service after changes constitutes acceptance

19.2 User Responsibility:
- Users are responsible for reviewing Terms periodically
- Users should check for updates regularly
- Current version of Terms is always available on the Platform`,
    },
    {
      id: 'contact',
      title: '20. Contact Information',
      content: `For questions, concerns, or support regarding these Terms and Conditions, please contact us:

Email: support@driveon.com
Phone: +91-XXXXX-XXXXX
Address: [Company Address]

Support Hours: Monday to Friday, 9:00 AM to 6:00 PM IST`,
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
        </div>
        <div className="relative px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1 touch-target hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">Terms & Conditions</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-lg border-2 p-4 md:p-6 mb-6" style={{ borderColor: theme.colors.borderLight }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <svg className="w-6 h-6" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  DriveOn Terms & Conditions
                </h2>
                <p className="text-sm md:text-base mt-1" style={{ color: theme.colors.textSecondary }}>
                  Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
              Please read these Terms and Conditions carefully before using the DriveOn car rental platform. By using our Service, you agree to be bound by these Terms.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-4 md:space-y-6">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-md border-2 overflow-hidden hover:shadow-lg transition-shadow"
                style={{ borderColor: theme.colors.borderLight }}
              >
                <div className="px-4 md:px-6 pt-4 md:pt-5 pb-3 md:pb-4 border-b-2" style={{ borderColor: `${theme.colors.primary}20` }}>
                  <h3 className="text-base md:text-lg font-bold" style={{ color: theme.colors.primary }}>
                    {section.title}
                  </h3>
                </div>
                <div className="px-4 md:px-6 py-4 md:py-5">
                  <div className="text-sm md:text-base leading-relaxed whitespace-pre-line" style={{ color: theme.colors.textSecondary }}>
                    {section.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agreement Section */}
          <div className="mt-8 md:mt-10 bg-gradient-to-r rounded-xl shadow-lg border-2 p-4 md:p-6" style={{ 
            borderColor: theme.colors.primary,
            background: `linear-gradient(to right, ${theme.colors.primary}08, white)`
          }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <svg className="w-5 h-5" style={{ color: theme.colors.primary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Agreement to Terms
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  By using the DriveOn platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these Terms, you must not use our Service.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs md:text-sm" style={{ color: theme.colors.textTertiary }}>
              © {currentYear} DriveOn. All rights reserved.
            </p>
            <p className="text-xs md:text-sm mt-2" style={{ color: theme.colors.textTertiary }}>
              For questions about these Terms, please contact our support team.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditionsPage;

