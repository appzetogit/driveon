import { useNavigate } from 'react-router-dom';
import { theme } from '../theme/theme.constants';

/**
 * PrivacyPolicyPage Component
 * Comprehensive Privacy Policy page for DriveOn Car Rental App
 * Based on document.txt - covers data collection, KYC, tracking, payments, etc.
 */
const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      id: 'introduction',
      title: '1. Introduction',
      content: `Welcome to DriveOn ("we", "our", "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our car rental platform ("Platform", "Service").

By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.

This Privacy Policy applies to all users of the Platform, including renters, car owners, guarantors, and visitors.`,
    },
    {
      id: 'information-collection',
      title: '2. Information We Collect',
      content: `2.1 Personal Information:
We collect personal information that you provide directly to us, including:
- Full Name
- Email Address
- Phone Number
- Age
- Gender
- Complete Address
- Profile Photo
- Account credentials (email, password)

2.2 KYC Documents (via DigiLocker):
We collect verified documents through DigiLocker OAuth2 integration:
- Aadhaar Card details
- PAN Card details
- Driving License details
- Document verification status

2.3 Location Data:
- Real-time GPS location during active trips (collected every 10 seconds)
- Location data is stored for 6 months for security and dispute resolution purposes
- Location tracking is automatically enabled when a trip starts and disabled when the trip ends

2.4 Payment Information:
- Payment method details (processed through Razorpay/Stripe)
- Transaction history
- Billing address
- Payment preferences (Full Payment or 20% Advance Payment)

2.5 Booking Information:
- Car rental bookings
- Pickup and drop-off dates and times
- Trip duration
- Dynamic pricing information
- Booking status and history

2.6 Guarantor Information:
- Guarantor's contact details (phone/email)
- Guarantor's KYC verification status
- Relationship between user and guarantor

2.7 Usage Data:
- Device information
- IP address
- Browser type and version
- Pages visited and time spent
- Search queries and filters used
- App usage patterns

2.8 Reviews and Ratings:
- Car ratings and reviews
- Trip experience ratings
- User feedback and comments`,
    },
    {
      id: 'how-we-use',
      title: '3. How We Use Your Information',
      content: `We use the collected information for the following purposes:

3.1 Service Provision:
- To provide, maintain, and improve our car rental services
- To process bookings and manage reservations
- To calculate dynamic pricing based on date, time, duration, and demand
- To facilitate communication between renters, car owners, and guarantors
- To enable live location tracking during trips

3.2 Account Management:
- To create and manage your account
- To verify your identity through KYC verification
- To process profile completion (100% required for booking)
- To manage guarantor relationships

3.3 Payment Processing:
- To process payments (Full Payment or 20% Advance Payment)
- To handle refunds and cancellations
- To manage security deposits
- To process auto-debit of remaining amounts

3.4 Safety and Security:
- To monitor vehicle location during trips for safety
- To prevent fraud and unauthorized access
- To resolve disputes and investigate incidents
- To ensure compliance with rental agreements

3.5 Communication:
- To send booking confirmations and updates
- To notify about trip status and reminders
- To send payment receipts and invoices
- To provide customer support
- To send promotional offers and referral program updates

3.6 Legal Compliance:
- To comply with legal obligations
- To respond to legal requests and court orders
- To protect our rights and property
- To enforce our Terms and Conditions`,
    },
    {
      id: 'information-sharing',
      title: '4. Information Sharing and Disclosure',
      content: `We may share your information in the following circumstances:

4.1 With Car Owners:
- Car owners receive booking information for their vehicles
- They can view renter's profile information (name, contact, rating)
- They have access to live tracking data during active trips
- They receive payment and booking status updates

4.2 With Guarantors:
- Guarantors receive notifications about booking status
- They can view basic booking information
- They are notified about any issues or disputes

4.3 With Service Providers:
- Payment processors (Razorpay, Stripe) for payment processing
- DigiLocker for KYC verification
- Cloud storage providers (AWS S3, Cloudinary) for document and image storage
- Analytics services for app improvement
- Push notification services (Firebase) for notifications

4.4 Legal Requirements:
- When required by law or legal process
- To respond to government requests
- To protect our rights and safety
- To prevent fraud or illegal activities

4.5 Business Transfers:
- In case of merger, acquisition, or sale of assets
- Your information may be transferred to the new entity

4.6 With Your Consent:
- We may share information with third parties when you explicitly consent`,
    },
    {
      id: 'location-tracking',
      title: '5. Location Tracking',
      content: `5.1 Tracking During Trips:
- Location tracking is mandatory for all active bookings
- GPS location is collected every 10 seconds during active trips
- Tracking is automatically enabled when a trip starts
- Tracking is automatically disabled when a trip ends

5.2 Purpose of Tracking:
- Vehicle security and safety
- Real-time monitoring for car owners and admin
- Emergency assistance
- Dispute resolution
- Compliance with rental agreement

5.3 Data Storage:
- Location data is stored for 6 months
- After 6 months, location data is automatically deleted
- Data is used only for the purposes stated above
- We comply with all applicable data protection laws

5.4 Your Control:
- You can disable location tracking in Settings (but this may affect booking eligibility)
- Location tracking is required for active bookings
- You will be notified when tracking is enabled/disabled`,
    },
    {
      id: 'kyc-verification',
      title: '6. KYC Verification via DigiLocker',
      content: `6.1 DigiLocker Integration:
- We use DigiLocker OAuth2 for secure document verification
- You will be redirected to DigiLocker to authorize access
- We fetch verified documents (Aadhaar, DL, PAN) from DigiLocker
- Documents are stored securely in our system

6.2 Document Storage:
- Verified documents are stored securely
- Documents are encrypted and protected
- Only authorized personnel can access KYC documents
- Documents are used only for verification purposes

6.3 Document Access:
- Documents are shared with admin for KYC approval
- Car owners do not have access to your KYC documents
- Documents are retained as required by law

6.4 Your Rights:
- You can request to view your stored documents
- You can request document deletion (subject to legal requirements)
- You can update documents through DigiLocker re-verification`,
    },
    {
      id: 'data-security',
      title: '7. Data Security',
      content: `We implement appropriate technical and organizational measures to protect your personal information:

7.1 Security Measures:
- Encryption of sensitive data in transit and at rest
- Secure authentication using JWT tokens
- Regular security audits and assessments
- Access controls and authentication
- Secure payment processing through certified providers

7.2 Data Storage:
- Data is stored on secure servers
- Regular backups are maintained
- Access is restricted to authorized personnel only
- We use industry-standard security protocols

7.3 Account Security:
- You are responsible for maintaining the confidentiality of your account credentials
- We recommend using strong passwords
- Enable two-factor authentication if available
- Notify us immediately of any unauthorized access

7.4 Breach Notification:
- In case of a data breach, we will notify affected users as required by law
- We will take immediate steps to mitigate the breach
- We will report breaches to relevant authorities when necessary`,
    },
    {
      id: 'data-retention',
      title: '8. Data Retention',
      content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy:

8.1 Account Information:
- Account information is retained while your account is active
- After account deletion, data may be retained for legal compliance

8.2 Booking Data:
- Booking history is retained for record-keeping and dispute resolution
- Financial records are retained as required by law (typically 7 years)

8.3 Location Data:
- Location tracking data is retained for 6 months
- After 6 months, location data is automatically deleted

8.4 KYC Documents:
- KYC documents are retained as required by law
- Documents may be retained even after account deletion for legal compliance

8.5 Deletion Requests:
- You can request deletion of your data
- Some data may be retained for legal compliance
- We will inform you about data that cannot be deleted`,
    },
    {
      id: 'your-rights',
      title: '9. Your Rights',
      content: `You have the following rights regarding your personal information:

9.1 Access Rights:
- You can request access to your personal information
- You can view your profile, bookings, and payment history
- You can request a copy of your data

9.2 Update Rights:
- You can update your profile information at any time
- You can modify your account settings
- You can update your preferences

9.3 Deletion Rights:
- You can request deletion of your account
- You can request deletion of specific data
- Some data may be retained for legal compliance

9.4 Data Portability:
- You can request a copy of your data in a portable format
- We will provide data in a commonly used format

9.5 Opt-Out Rights:
- You can opt-out of marketing communications
- You can disable location tracking (may affect booking eligibility)
- You can manage notification preferences

9.6 Withdrawal of Consent:
- You can withdraw consent for data processing
- Withdrawal may affect your ability to use certain features
- Some processing may continue for legal compliance`,
    },
    {
      id: 'cookies-tracking',
      title: '10. Cookies and Tracking Technologies',
      content: `10.1 Cookies:
- We use cookies to enhance your experience
- Cookies help us remember your preferences
- We use session cookies and persistent cookies
- You can control cookies through your browser settings

10.2 Analytics:
- We use analytics tools to understand app usage
- Analytics help us improve our services
- Data is anonymized where possible

10.3 Third-Party Tracking:
- Some third-party services may use tracking technologies
- These services have their own privacy policies
- We are not responsible for third-party tracking practices`,
    },
    {
      id: 'third-party-services',
      title: '11. Third-Party Services',
      content: `Our Service integrates with third-party services:

11.1 Payment Processors:
- Razorpay and Stripe for payment processing
- These services have their own privacy policies
- Payment information is processed securely by these providers

11.2 DigiLocker:
- DigiLocker for KYC verification
- DigiLocker's privacy policy applies to their services
- We only receive verified documents you authorize

11.3 Cloud Storage:
- AWS S3 and Cloudinary for image and document storage
- These services provide secure storage solutions

11.4 Push Notifications:
- Firebase for push notifications
- Notification preferences can be managed in Settings

11.5 Map Services:
- Map services for location features
- Map providers may collect location data as per their policies`,
    },
    {
      id: 'children-privacy',
      title: '12. Children\'s Privacy',
      content: `Our Service is not intended for users under the age of 18. We do not knowingly collect personal information from children under 18.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. We will take steps to delete such information from our systems.`,
    },
    {
      id: 'international-users',
      title: '13. International Data Transfers',
      content: `Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws.

By using our Service, you consent to the transfer of your information to these countries. We ensure appropriate safeguards are in place to protect your information during international transfers.`,
    },
    {
      id: 'policy-updates',
      title: '14. Changes to This Privacy Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by:
- Posting the new Privacy Policy on this page
- Updating the "Last Updated" date
- Sending you an email notification (for material changes)
- Displaying a notice in the app

You are advised to review this Privacy Policy periodically for any changes. Changes are effective when posted on this page.

Your continued use of the Service after changes are posted constitutes acceptance of the updated Privacy Policy.`,
    },
    {
      id: 'contact',
      title: '15. Contact Us',
      content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:

Email: privacy@driveon.com
Phone: +91-XXXXX-XXXXX
Address: [Company Address]

Support Hours: Monday to Friday, 9:00 AM to 6:00 PM IST

For data protection inquiries, please use the subject line "Privacy Policy Inquiry" in your email.`,
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
            <h1 className="text-lg font-bold text-white">Privacy Policy</h1>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: theme.colors.textPrimary }}>
                  DriveOn Privacy Policy
                </h2>
                <p className="text-sm md:text-base mt-1" style={{ color: theme.colors.textSecondary }}>
                  Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
              This Privacy Policy describes how DriveOn collects, uses, and protects your personal information when you use our car rental platform. We are committed to protecting your privacy and ensuring the security of your data.
            </p>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-4 md:space-y-6">
            {sections.map((section) => (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
                  Your Privacy Matters
                </h3>
                <p className="text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                  We are committed to protecting your privacy and ensuring the security of your personal information. If you have any questions or concerns about this Privacy Policy or our data practices, please contact us using the information provided in the Contact section.
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
              For questions about this Privacy Policy, please contact our privacy team.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicyPage;

