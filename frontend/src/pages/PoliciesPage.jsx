import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../theme/theme.constants';

/**
 * PoliciesPage Component
 * Shows all policy links at top, and displays selected policy content below
 * Privacy Policy content from user's provided text (Zoomcar replaced with DriveOn)
 */
const PoliciesPage = () => {
  const navigate = useNavigate();
  const [selectedPolicy, setSelectedPolicy] = useState('privacy'); // Default to privacy

  const policies = [
    {
      id: 'fee-policy',
      label: 'Fee Policy: Guest Fee Policy',
      path: '/policies/fee-policy',
    },
    {
      id: 'terms',
      label: 'Platform Terms of Use',
      path: '/terms',
    },
    {
      id: 'c2c-terms',
      label: 'C2C Terms and Conditions - Host & Guest',
      path: '/policies/c2c-terms',
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      path: '/policies/privacy',
    },
    {
      id: 'gift-cards',
      label: 'Gift Cards Terms & Conditions',
      path: '/policies/gift-cards',
    },
  ];

  const privacyPolicyContent = `PRIVACY POLICY

Last Updated - 07 October 2025

At DriveOn, your trust is our most valuable asset and we are committed to protecting your privacy. This Privacy Policy explains how DriveOn India Private Limited ("DriveOn", "We", "Us", or "Our") collects, uses, shares, and safeguards your personal data when you interact with our platform on our website www.driveon.com, services, mobile applications, and other digital interfaces ("Platform")—whether as a Host, Guest, or Visitor.

We understand the importance of secure transactions and transparent data practices. Whether you're browsing, booking, or listing a vehicle as a Guest or Host, we want you to feel confident in how your data is handled.

This Policy outlines:

What types of personal data we collect and why

How we store, process, and share this data

Your rights and choices regarding your data

How to contact us in case of questions or concerns

By visiting or using the Platform, providing your information, or availing of any service, you expressly agree to the terms of this Privacy Policy, along with our Terms and Conditions and other applicable policies available on the Platform. Please note, DriveOn's products and services are offered only within India, and your personal data will be processed and stored in India at our registered office: No. 147, 1st Floor, Anjaneya Techno Park, HAL Old Airport Road, Kodihalli, Bangalore, Karnataka - 560008.

 

1. Collection and Use of Personal Data

To deliver a safe, reliable, and seamless experience across DriveOn's Host-Guest ecosystem, we collect and use various categories of personal data from users interacting with our platform, services, or vehicles ("You", "Your", "User"). The types of data we collect to operate and improve our services efficiently and securely in compliance with applicable laws, including the Digital Personal Data Protection Act, 2023 and the reasons for such collection are detailed below.

a. Information You Provide

We collect the following types of personally identifiable information when you create an account, book a trip, list a vehicle, update your account profile, contact customer support, participate in referrals or reward programs or otherwise interact with the DriveOn Platform:

Identity & Contact Information: Full name, email address, mobile number, photograph, gender, date of birth, and postal address(es).

Government ID & KYC: Aadhaar, Driving License, or other government approved identification/address proof documents

Vehicle Information: Applicable only to Hosts

Mandatory: Registration Certificate (RC) and valid comprehensive insurance of the vehicle.

Based on Applicability: Other documents such as the Pollution Under Control (PUC) Certificate, and applicable permits.

Financial & Payment Data: PAN, bank account details, UPI/credit/debit card details (as required), cancelled cheque (as and when applicable) and transaction histories.

Professional Data (for corporate users or business partnerships): KYC details of authorised signatories/representatives, business registration, GST, TAN, and associated entity records.

Miscellaneous: Any other items of sensitive personal data or information, as such term is defined under the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data of Information) Rules, 2011 enacted under the Information Technology Act, 2000.

You voluntarily consent to the collection and processing of your personal data when you register on or use the DriveOn Platform. Such usage shall be deemed as your consent for the purposes specified under this Privacy Policy and our Terms of Use.

In certain cases, where additional permissions are required (e.g., for accessing your mobile device's location), your explicit consent at the time of activation will be treated as valid consent under applicable laws.

b. Information We Collect

When you access the DriveOn platform or use our services, we may automatically collect certain technical and behavioural information. Where this data is or can reasonably be linked to your identity (e.g., via account login, device ID, IP address), we classify it as personal data. This includes:

Device & App Usage Data: Device type, operating system, IP address, browser type, language preferences, unique device identifiers (IMEI, MAC, etc.), crash logs, and app interaction data tied to your user account.

Cookies & Web Beacons: Session cookies and analytics tools that collect behaviour linked to your user profile or IP address. Used for session management, analytics, personalized content delivery, and fraud detection. You can manage these via your browser settings.

Platform Navigation: Session timing, viewed pages, clicks, search terms, interaction patterns, referral URLs, and exit paths tied to your login session, to optimize user experience.

Location Data: If you have granted permission, GPS-based real-time or one-time location, linked to your ongoing booking (outlined under "Location Data & Trip Monitoring") will be collected.

Note: Some of this data may also be collected in a de-identified or aggregated manner. In such cases, it is addressed under Section 3 titled "Collection and Use of Non-Personal Information".

c. Location Data & Trip Monitoring (User Device and Vehicle Hardware-Based)

With your explicit consent and the type of access you grant, we collect real-time location data during the course of active trips to ensure safe, transparent, and accountable trip experiences. Location tracking will occur through the following mechanisms:

User Device-Based Tracking

When you begin a trip, we will request access to your device's location depending on the consent you provide within the app:

One-Time Access captures only the pickup and drop coordinates (Trip Start and End).

Continuous Access enables live location tracking throughout the trip duration to assist with real-time route monitoring, delay detection, and in-trip safety events. This tracking begins at the trip start time and ends automatically once the vehicle is returned.You may withdraw consent at any time by disabling app-level location permissions in your device settings.

GPS Tracker-Based Tracking (Host Opt-In Model)

If the vehicle you have booked is equipped with a GPS device or telematics device installed by us (with the Host's consent at the time of onboarding), we will also collect vehicle-based location data during the trip. The type of device installed may vary depending upon various factors such as business requirements etc., and we may periodically replace or upgrade these devices to support evolving service features and system capabilities. These devices may collect:

Live Location & Route History: Captured for safety support, trip monitoring, theft recovery, and operational efficiency.

Vehicle Diagnostics: Includes ignition status, and fault codes.

Driving Behaviour: Speed motions, braking, idling, and acceleration to prevent misuse and improve experience.

Tamper Alerts & Immobilizer Control: Some vehicles may be equipped with telematics devices that support tamper detection and remote immobilization. In such cases, if interference with the device is detected, we may receive alerts and, where required, initiate immobilization to enforce trip rules or assist in vehicle recovery. This feature is dependent on the type of device installed and is not accessible to Hosts.

The installation of GPS tracking hardware is fully optional and activated only after the Host provides express consent during the vehicle onboarding process. This vehicle-fitted GPS system does not track users outside the booking period and is disabled post-trip.

Your location derived from either of the methods or both will be used to:

Ensure safety and provide enhanced trip monitoring and geofencing logic.

Help in detecting route deviation and locating the vehicle during delays or emergencies.

Assist in real-time road-side assistance, accident response, or recovery.

Verify return timelines and prevent misuse through anti-theft alerts.

Provide retrieval support in case of system failures or mobile app uninstalls.

In case of critical delays or suspected safety concerns, we may share Guest location with the associated Host, strictly for security purposes.

In both cases, any collected location data is securely stored for up to 6 months to resolve post-trip disputes, incidents, or legal queries (e.g., challans or accident reporting), after which it is automatically deleted. We may be required to retain some portions of this data under applicable laws for longer periods.

You may withdraw consent anytime via your device's location settings. However, denying or withdrawing location access may limit or prevent use of certain services, including initiating a booking.

Note: DriveOn does not track your live location outside the trip window.

d. Third-Party Source Data

Where permitted by law or necessary for operations, to verify your identity, validate documents, ensure regulatory compliance, and safeguard platform integrity, we may collect or supplement your personal data from third-party sources in accordance with applicable laws. These third-party sources may include, but are not limited to:

Government & Regulatory Portals

We may retrieve information from publicly accessible government databases such as:

VAHAN/RTO portals for vehicle registration, chassis verification, or permit status checks.

GSTN Directory (in case of Fleet Operators) to verify business registration.

UIDAI (Unique Identification Authority of India): To validate identity and address information linked to Aadhaar, subject to applicable laws and user consent.

Public Legal and Law Enforcement Records

We may consult publicly disclosed traffic violation/challan portals, or consumer complaints if relevant to the performance of a booking or associated legal risk.

Public Business or Professional Listings

Where required for fraud prevention or business onboarding, we may validate information made public on:

Official company websites.

Business aggregators.

Voluntarily disclosed professional profiles (e.g., LinkedIn, JustDial, Google Business).

Third-Party KYC, Insurance, and Verification Services

We may partner with regulated and government-affiliated third-party service providers for KYC, document verification, driving license validation, or biometric checks (if legally permitted and explicitly consented to by the user). These service providers are contractually bound to handle your data securely and only for the specified purpose.

2. Purpose for Collection of Your Personal Information

We collect, use, and retain your personal data strictly for purposes that are lawful, proportionate, and necessary to deliver and improve our services. The key purposes for processing your data include:

a. Communication, Booking and Service Fulfilment

To register you as a user – Host or Guest on the DriveOn Platform.

To enable vehicle listings, bookings, and subscription-based services.

To collect, verify, and authenticate your identity and eligibility (KYC).

To process payments, refunds, or claims.

To generate and share invoices and transaction records.

To contact you via phone, SMS, push notifications, email, or WhatsApp for service updates, confirmations, feedback, dispute resolution, and booking lifecycle events.

To respond to your feedback, complaints, and support requests in a timely and contextual manner.

b. Real-Time Support & Location-Based Services

To provide customer support during your booking lifecycle.

To assist with in-trip issues such as delays, breakdowns, fuel emergencies, or accidents.

To allow live GPS-based location tracking (via device and/or Host-installed GPS hardware) for:

Route navigation and pickup/drop verification.

Delay detection and Host notification.

Ensuring your safety and facilitating roadside assistance.

To share location data with law enforcement, insurance agencies, Hosts, or third parties only in accordance with your consent or applicable law.

c. Host & Guest Vetting and Compliance

To verify ownership of the Host vehicle, emission certificate, etc.

To validate driving license and vehicle records from government-authorized sources.

To conduct background checks, blacklist screenings, or fraud checks (directly or via regulated third parties).

To monitor compliance with platform policies and the Motor Vehicles Act, 1988.

d. Marketing, Personalization & Platform Optimization

To send transactional alerts, payment reminders, and promotional offers.

To personalize your user experience based on your past usage, location, preferences, or profile.

To analyse trends, improve services, optimize pricing, and reduce cancellations.

To enable referral programs, loyalty schemes, and user rewards.

Note: You may opt out of marketing communications at any time through your app preferences.

e. Security, Fraud Detection & Risk Management

To identify and prevent unauthorized or suspicious platform usage.

To monitor IP address, device identifiers, access time logs, and geo anomalies.

To flag repeat cancellations, tampering, damage, or account misuse.

To trigger risk alerts for payment fraud or unauthorized access.

To maintain platform hygiene and integrity across Host and Guest accounts.

f. Legal, Regulatory, and Contractual Obligations

To comply with applicable laws including the DPDP Act, 2023, the Information Technology Act, 2000, and the Motor Vehicles Act, 1988.

To process personal data for insurance claims, police investigations, or court directives.

To respond to lawful requests from enforcement authorities and to protect our rights, property, or user safety.

To facilitate audits, compliance reviews, or tax/regulatory reporting requirements.

g. User Consent and Platform Integrity

To ensure your choices are respected through clear, unbundled consent notices.

To record, track, and honour your preferences and opt-out requests.

To store device- and session-level permissions for sensitive actions (e.g., location access).

h. Image, Camera Access, and Media Inputs

When you use our camera-enabled features — such as uploading your profile photo, capturing documents for KYC, recording vehicle condition, or submitting photos/videos during disputes or damage claims — we collect and process these media inputs to fulfil your requests. This helps us verify your identity, evaluate vehicle health, investigate complaints, and improve platform reliability.

Your media files are used only for the intended service context and are stored securely, in accordance with our data retention policy.

Note: Your data will only be processed for purposes for which you've given explicit consent or where required under a legitimate legal basis. You may withdraw your consent at any time via app settings or by contacting our Grievance Officer. Upon withdrawal, we will restrict or cease further processing of your data unless legally required to retain it.

3. Collection and Use of Non-Personal Information

In addition to personal data, we may collect, receive or use a variety of non-personal information to improve platform performance, personalize user experience, ensure platform security, and support analytics and advertising services. Such data will continue to be classified as non-personal unless or until it is linked to an identifiable individual.

a. Technical and Operational Usage Data

We collect limited technical and operational data through your interaction with our platform, mobile application, or services. This may include information that, while not actively used to identify you, may still be linked to your account or device in some cases. Such data includes:

Aggregated insights from anonymized user activity (e.g., demographic stats, total page views, heat maps, feature usage trends) to produce statistical insights, audience segments, and trend analyses.

Technical telemetry not linked to a user account (e.g., app crash logs without login, session diagnostics).

Pixel and cookie data for session tracking and performance where no account is logged in.

De-identified navigation trends such as total page views or usage patterns.

Network and app performance data required to maintain service availability and troubleshoot issues..

Such data is used to analyse usage patterns, optimize platform performance, improve user experience, and inform business decisions.

Note: While some data may not be directly used to identify individuals, we do not currently implement full anonymization or irreversible de-identification processes. Accordingly, such data may still be considered personal data under applicable laws and will be subject to protections set forth in this policy.

 b. Cookies and Similar Tracking Technologies

We use cookies, pixels, SDKs, and similar tracking technologies provided by DriveOn or authorized third-party service providers (e.g., Google Analytics, Meta and others) to collect data about user interactions. These tools help us:

Measure user engagement and product performance.

Remember your preferences and login sessions.

Serve you relevant ads based on behaviour.

Improve navigation experience on mobile/web.

You may manage your cookie preferences through browser/written requests. Please note that disabling certain cookies may impact platform functionality.

c. Use of Non-Personal Information

DriveOn uses non-personal information for the following purposes:

To conduct internal research, performance audits, and A/B testing.

To personalize in-app recommendations and push notifications.

To detect unusual patterns, system abuse, and fraud.

To enhance content placement, pricing experiments, and referral program tracking.

To monitor service usage and feature adoption.

To improve user experience through navigation and UX refinements.

d. Sharing of Non-Personal Information

We may share aggregated or anonymized non-personal information with:

Advertisers to help them understand user trends.

Analytics and marketing partners for campaign optimization.

Research collaborators for mobility insights and transport studies.

Third-party platforms for interest-based ad targeting.

However, we do not sell, license, or share any data that can directly or indirectly identify a user unless required under law.

e. Respecting Your Choice

You may limit or disable cookie-based tracking through your browser settings; however, full opt-out from certain tracking mechanisms and ad personalization on our platform is currently supported only via written requests. If you wish to opt out of such tracking or learn more about how your non-personal information is used, you may write to us at grievance.officer@driveon.com.

 4. Sharing of Personal Data

We may share your personal data under the following circumstances, with appropriate safeguards, and only to the extent necessary for the fulfilment of lawful and service-related purposes:

a. Service Providers and Business Partners

We may share your data with trusted third-party service providers who perform services on our behalf. These include payment processors, cloud infrastructure providers, analytics platforms, advertising partners, customer support vendors, and SMS/email service providers. All such entities are bound by strict confidentiality and data protection obligations aligned with this policy.

b. Vehicle Owners (Hosts) and Guests

In the course of providing our Host-Guest platform services, certain information will be shared between the Host and Guest to facilitate the trip experience, ensure secure and authenticated vehicle handovers, and manage accountability. This includes:

Booking details and car information.

Profile verification selfie submitted by the Guest (at the time of registration or KYC) with the respective Host. This is done solely to verify that the person arriving to collect the vehicle matches the individual who made the booking. This image is shared at the time of pickup and for the limited purpose of identity verification during the handover process

Verified contact details (e.g., phone number/email) necessary for pickup or communication during emergencies.

Live location data (only if the Guest has granted consent or in cases of delays, post-trip discrepancies, or vehicle non-return).

Vehicle document snapshots (such as RC copy, insurance) to validate listing authenticity

Location data may also be collected via GPS hardware installed in the Host's vehicle if opted-in during onboarding.

c. Legal Compliance and Law Enforcement

We may disclose your personal data where required by applicable law, governmental request, legal process, or court order. This includes situations involving:

Prevention, detection, or investigation of crime or fraud.

Responding to traffic enforcement notices or third-party claims.

Protection of our rights, property, or safety, or that of our users or the public

When permitted, we will notify the user of such disclosure unless legally prohibited.

d. With Your Consent

We may share your data with third parties when you explicitly consent to such sharing. This includes participation in promotional campaigns, partnerships, or contests with third parties where you opt-in.

e. Business Transfers

In case of a merger, acquisition, reorganization, sale of assets, or bankruptcy, your personal data may be transferred to the relevant third party involved. You will be notified in the event of such a transfer along with your data rights.

f. Internal Affiliates and Group Companies

We may share personal data with our affiliates, subsidiaries, and group entities for business operations, centralized processing, fraud detection, marketing communication (where permitted), and infrastructure optimization. All such sharing is covered under group-level agreements and privacy safeguards.

Note: DriveOn does not sell your personal data to any third party. All data shared is done so under contractual obligations ensuring security, non-disclosure, and lawful usage.

5. Security of Your Personal Information

We are committed to safeguarding your personal information and have implemented appropriate administrative, technical, and physical safeguards to protect your data against unauthorized access, loss, misuse, alteration, or destruction. Our security practices include:

Encryption of data in transit using secure HTTPS and TLS protocols.

Role-based access controls and strict internal audits.

Periodic reviews of data collection, processing, and storage mechanisms.

Hosting data in secure, firewall-protected infrastructure with disaster recovery protocols.

We only work with certified payment gateway providers who follow Payment Card Industry Data Security Standards (PCI DSS) when processing payments, refunds or any other relevant information.

We may share your data with third parties under confidentiality agreements. However, we are not liable for any breach of security by such third parties unless such breach arises due to our gross negligence or wilful misconduct.

You are solely responsible for safeguarding login credentials and maintaining the confidentiality of your account. We recommend that you sign off after using shared devices and avoid sharing passwords with anyone.

We shall not be liable for any loss or misuse of personal data due to events beyond our control ("Force Majeure Events"), including but not limited to: fires, floods, cyberattacks, governmental actions, internet outages, unauthorized access to computer systems, or any other cause reasonably beyond our control.

6. Retention of Data

We retain your personal data only for as long as it is necessary to fulfil the purposes outlined in this policy, including to:

Provide and improve our services.

Comply with legal obligations.

Resolve disputes.

Enforce our agreements.

Safeguard the rights, safety, and interests of DriveOn, Hosts, Guests, and the public.

Our data retention practices are purpose-specific, and the durations vary depending on the nature of the data and applicable regulatory requirements.

a. Booking & Trip-Related Data

Personal information associated with bookings (e.g., trip logs, car usage, GPS trail—if continuous tracking consent is given) is retained for a maximum of 6 months post-trip completion for dispute resolution, insurance claims, law enforcement requests, or Host-Guest conflicts. Thereafter, it is securely deleted unless retention is required by applicable law.

b. KYC, Identity & Verification Documents

Data such as Aadhar, Driver's License, PAN, and other documents submitted for verification or onboarding (by either the Host or Guest) is stored for as long as the user remains active on the platform, and mandatorily for a minimum of 90 days post account closure, in compliance with motor vehicle and taxation regulations, unless legally required to retain for longer. 

c. Payment & Financial Records

Bank account, UPI info, and transaction logs are retained for 8 years as per financial and taxation norms (e.g., Income Tax Act and Prevention of Money Laundering Act). Tokenized card data is stored only in compliance with RBI regulations and through PCI-DSS certified vendors.

d. Consent Logs

Consent records (e.g., timestamp, method, and type of consent) are retained for at least 90 days, or longer if any associated data (such as live location tracking or camera access) is retained as per relevant requirement.

e. Communication & Support Logs

Customer support conversations, emails, and in-app chats may be retained for up to 3 years to improve service quality, track unresolved queries, or for internal audit purposes.

f. Image & Camera Inputs

Images/videos provided voluntarily through the app (for ID verification, damage reporting, etc.) are retained for a maximum of 6 months, unless a longer retention is required to address disputes or insurance claims.

g. Deletion and Anonymization

Once the retention period ends, we either:

Permanently delete the data in a secure manner.

Or anonymize it so that it cannot be linked back to any individual.

Upon user request, personal data will also be deleted within a reasonable timeframe, unless we are legally required to retain it.

Note: In cases where a Host or Guest has violated our terms, been reported for misconduct, or involved in legal claims, we reserve the right to retain their data beyond the above-mentioned retention period to assist with enforcement or future investigations.

7. Your Rights and Choices

DriveOn is committed to ensuring transparency and giving users control over their personal data. As a data principal in line with global privacy norms, you are entitled to exercise the following rights:

a. Right to Access

You have the right to request details about the personal data we hold about you, including:

Categories of personal information collected.

Specific data points (e.g., contact info, KYC docs).

Sources of data collection.

Purpose of processing.

Third parties or affiliates with whom data is shared.

You can raise an access request via the app or by emailing us at grievance.officer@driveon.com

b. Right to Correction and Updating

If any of your personal data is incorrect, outdated, or incomplete, you have the right to request correction. For example, updating your:

Email or phone number.

KYC documents.

Vehicle details (for Hosts).

Payment methods.

Corrections can be made directly through your DriveOn account, or via written request to grievance.officer@driveon.com.

c. Right to Withdraw Consent

Where processing is based on your consent (e.g., location tracking, camera/image inputs, promotional communications), you may withdraw such consent at any time by:

Adjusting app settings (e.g., disabling location permissions).

Using opt-out links in marketing communications.

Sending a written request to our Grievance Officer.

Note: Withdrawal of consent may prevent us from delivering key services (e.g., starting a trip without location access or completing verification without KYC), and may result in restricted access to the platform.

d. Right to Deletion

You can request that we delete your personal data when:

The data is no longer necessary for the purposes it was collected.

You withdraw consent for specific processing.

You close your DriveOn account.

You believe your data has been processed unlawfully.

Upon receiving your verified deletion request, we will:

Permanently delete your personal data within a reasonable timeframe (unless legally obligated to retain it).

Provide you with a confirmation once deletion is completed. 

Account Deletion: If you wish to permanently delete your DriveOn account, you may do so by navigating to the Settings screen from the Profile tab on the home screen of the DriveOn App, and selecting the "Delete Account" option. Alternatively, you can also initiate deletion via this link: https://www.driveon.com/users/profile#delete_account.

Please Note: Deleting your account may not remove all your User Contributions (such as reviews, ratings, feedback, etc.) from our platforms. These may continue to appear in cached or archived pages, or may have been copied or stored by other users. Proper access and use of information on our Platform, including User Contributions, will continue to be governed by this Privacy Policy.

Additionally, some data may still be retained temporarily for audit, fraud prevention, or regulatory purposes.

e. Right to Nominate

You may nominate another individual to exercise your rights in the event of death or incapacity. If you wish to add a nominee, please reach out to our Grievance Officer via email for verification and registration.

f. Communication Preferences

We provide you the flexibility to manage communication settings:

Opt-out of marketing/promotional SMS/emails/push notifications.

Continue receiving essential communication (e.g., booking updates, policy changes). 

You can update your preferences in-app or contact our support team.

g. Right to File a Grievance

If you have any concerns regarding our handling of your data, you can raise a grievance with our designated Grievance Officer (detail provided at the bottom),

8. Children's Information

DriveOn does not knowingly collect or solicit personal information from individuals below the age of 18. If you believe a child has provided us personal data without verified parental consent, please contact our Grievance Officer at the details provided below.

If you provide personal data on behalf of a minor (as a parent or legal guardian), you represent that you have the authority to do so and agree to our use of such data in accordance with this Privacy Policy.

9. Miscellaneous

DriveOn shall not be held liable for any delay or failure in performing its obligations under this Privacy Policy if such delay or failure is caused by any Force Majeure Event. Force Majeure Event shall mean any event that is beyond the reasonable control of DriveOn and shall include, without limitation, sabotage, fire, flood, explosion, acts of God, civil commotion, strikes or industrial action of any kind, riots, insurrection, war, acts of government, computer hacking, unauthorised access to computer, computer system or computer network, computer crashes, breach of security and encryption (provided beyond reasonable commercial control of DriveOn), power or electricity failure or unavailability of adequate power or electricity.

10. Updates to this Privacy Policy

DriveOn reserves the right to revise this Privacy Policy from time to time to reflect changes in legal obligations, service features, or data processing practices.

When significant changes are made, we will notify you by updating the "Last Updated" date at the top of this document, displaying a prominent notice on our Platform, or sending an email notification if required by applicable law.

We encourage you to review this Policy periodically. Your continued use of our services after the changes become effective signifies your acknowledgment and acceptance of the updated terms.

 For more details or queries please feel free to reach out to our Grievance Officer:

Name: Mohit Kumar

Email: grievance.officer@driveon.com

Response Time: Within 7 business days`;

  const handlePolicyClick = (policyId) => {
    setSelectedPolicy(policyId);
    // Scroll to content section
    setTimeout(() => {
      const contentSection = document.getElementById('policy-content');
      if (contentSection) {
        contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="text-white relative overflow-hidden shadow-md" style={{ backgroundColor: theme.colors.primary }}>
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
            <h1 className="text-lg font-bold text-white">Policies</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-6 pb-4 md:pt-8 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Policies Section */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center" style={{ color: theme.colors.textPrimary }}>
              POLICIES
            </h2>
            <div className="border-t border-gray-300 mb-6"></div>
            
            {/* Policy Links - First Row */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4">
              {policies.slice(0, 4).map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => handlePolicyClick(policy.id)}
                  className={`text-sm md:text-base transition-colors ${
                    selectedPolicy === policy.id
                      ? 'font-bold'
                      : 'font-normal'
                  }`}
                  style={{
                    color: policy.id === 'privacy' 
                      ? '#22c55e' // Green color for Privacy Policy
                      : selectedPolicy === policy.id 
                        ? theme.colors.primary 
                        : theme.colors.textPrimary,
                  }}
                >
                  {policy.label}
                </button>
              ))}
            </div>

            {/* Policy Links - Second Row */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6">
              {policies.slice(4).map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => handlePolicyClick(policy.id)}
                  className={`text-sm md:text-base transition-colors ${
                    selectedPolicy === policy.id
                      ? 'font-bold'
                      : 'font-normal'
                  }`}
                  style={{
                    color: selectedPolicy === policy.id ? theme.colors.primary : theme.colors.textPrimary,
                  }}
                >
                  {policy.label}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-300"></div>
          </div>

          {/* Policy Content Section */}
          <div id="policy-content" className="mt-8">
            {selectedPolicy === 'privacy' && (
              <div className="bg-white rounded-xl shadow-lg border-2 p-4 md:p-6" style={{ borderColor: theme.colors.borderLight }}>
                <div className="prose prose-sm md:prose-base max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed" style={{ color: theme.colors.textSecondary }}>
                    {privacyPolicyContent}
                  </pre>
                </div>
              </div>
            )}

            {selectedPolicy !== 'privacy' && (
              <div className="bg-white rounded-xl shadow-lg border-2 p-4 md:p-6 text-center" style={{ borderColor: theme.colors.borderLight }}>
                <p className="text-sm md:text-base" style={{ color: theme.colors.textSecondary }}>
                  Content for {policies.find(p => p.id === selectedPolicy)?.label} will be available soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PoliciesPage;

