import { useNavigate } from 'react-router-dom';
import { theme } from '../theme/theme.constants';

/**
 * AboutUsPage Component
 * About Us page for DriveOn Car Rental App
 * Based on document.txt - covers company overview, features, mission, and services
 */
const AboutUsPage = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const sections = [
    {
      id: 'overview',
      title: 'About DriveOn',
      content: `DriveOn is a comprehensive car rental platform that revolutionizes the way people rent cars. We provide a seamless, secure, and user-friendly experience for both car renters and car owners.

Our platform combines advanced technology with trusted verification systems to ensure safe and reliable car rental services. With features like KYC verification through DigiLocker, real-time GPS tracking, flexible payment options, and a robust guarantor system, DriveOn sets new standards in the car rental industry.

Whether you're looking to rent a car for a weekend trip, a business journey, or an extended vacation, DriveOn makes the process simple, transparent, and secure.`,
    },
    {
      id: 'mission',
      title: 'Our Mission',
      content: `At DriveOn, our mission is to make car rental accessible, affordable, and secure for everyone. We believe that everyone should have the freedom to explore and travel without the hassle of traditional car rental processes.

We are committed to:
- Providing a transparent and user-friendly car rental experience
- Ensuring the highest levels of security through verified KYC and guarantor systems
- Offering flexible payment options that suit different needs
- Maintaining real-time tracking for safety and peace of mind
- Building a trusted community of renters and car owners`,
    },
    {
      id: 'features',
      title: 'What Makes Us Different',
      content: `DriveOn offers a unique combination of features that set us apart from traditional car rental services.

Our Verified KYC System ensures complete security through seamless integration with DigiLocker. This allows for automatic verification of Aadhaar, PAN, and Driving License documents, making the verification process quick and secure. We require 100% profile completion before any booking can be made, ensuring all users are properly verified.

Our Advanced Filter System lets you find the perfect car with ease. You can filter by brand, model, number of seats, fuel type, transmission, color, price range, rating, location, and real-time availability. Our comprehensive search capabilities and availability calendar make booking simple and convenient.

With Dynamic Pricing, you get fair and transparent pricing that adjusts based on date, time, duration, and demand. Our smart pricing engine includes weekend and holiday multipliers, peak hour surcharges, and seasonal adjustments to ensure competitive rates.

Live GPS Tracking provides real-time location updates every 10 seconds during active trips. This enhanced safety feature gives both renters and car owners peace of mind, with location data stored for 6 months for dispute resolution purposes.

We offer Flexible Payment Options to suit your needs. Choose between full payment or 20% advance payment, with secure processing through Razorpay and Stripe. Remaining amounts are automatically debited, and we handle security deposit management seamlessly.

Our Guarantor System adds an extra layer of security. The guarantor verification process ensures that all guarantors complete KYC verification, providing enhanced trust and security for car owners.

Finally, our Referral Program rewards you for bringing new users to the platform. Earn points when you refer friends, and use those points as discounts on your bookings.`,
    },
    {
      id: 'how-it-works',
      title: 'How It Works',
      content: `For Renters:

Getting started with DriveOn is simple. First, register with your email and phone number, verify the OTP, and complete your profile with all required information. Next, complete your KYC verification through DigiLocker by verifying your Aadhaar, PAN, and Driving License documents.

Once verified, add a guarantor who must also complete registration and KYC verification. Then browse and filter our extensive car collection based on your preferences - brand, model, price, location, and more. Select your preferred car and view detailed information including photos, features, and reviews.

When you're ready, book your car by selecting your preferred dates and choosing a payment option - either full payment or 20% advance payment. Complete the secure payment process, and you're all set. When your trip starts, GPS tracking is automatically enabled for your safety. At the end of your trip, simply complete the booking, and you can submit reviews to help other users.

For Car Owners:

Listing your car on DriveOn is straightforward. Register and complete your profile, then add your car with detailed information including photos, pricing, and availability calendar. You'll receive booking requests and can manage your calendar easily through our platform.

During active trips, you can monitor live GPS tracking to see where your car is in real-time. Payments are processed securely through our system, and you'll receive timely payments for all bookings. You can also receive and respond to reviews from renters, helping build your reputation on the platform.`,
    },
    {
      id: 'technology',
      title: 'Technology & Security',
      content: `DriveOn is built on modern, secure, and scalable technology to ensure the best possible experience for our users.

Our frontend is powered by React and Vite, providing a fast and responsive user interface. We use TailwindCSS for modern, mobile-first design that works seamlessly across all devices. State management is handled through Redux Toolkit, while React Query ensures efficient data fetching and caching.

On the backend, we use Node.js with Express.js to provide robust API services. Security is paramount, with JWT-based authentication ensuring secure access to all features. Real-time tracking updates are powered by Socket.io, and we use Node-cron for automated pricing calculations and reminder notifications.

For data storage, we rely on MongoDB for flexible and scalable data management. Redis handles session management and caching to ensure fast response times. All images and documents are securely stored using AWS S3 and Cloudinary, providing reliable and secure cloud storage.

Our platform integrates seamlessly with key services. DigiLocker OAuth2 handles KYC verification, while Razorpay and Stripe provide secure payment processing. Firebase powers our push notification system, and we have robust real-time GPS tracking with background location services.

Security is at the core of everything we do. We implement end-to-end encryption for all sensitive data, secure document storage with proper access controls, real-time fraud detection systems, and maintain location data for 6 months for security and dispute resolution purposes.`,
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: `We're here to help! Get in touch with us for any questions, concerns, or support you may need.

You can reach us via email at support@driveon.com or call us at +91-XXXXX-XXXXX. Our support team is available Monday to Friday, from 9:00 AM to 6:00 PM IST. We aim to respond to all inquiries within 24 hours during business days.

For business inquiries, including if you're a car owner looking to list your vehicle on our platform or have partnership opportunities, please contact us at business@driveon.com. Our business team will be happy to discuss how we can work together.

Our dedicated customer support team is available to assist you with a wide range of services. We can help with account and profile issues, provide booking assistance, answer payment queries, offer technical support, and help resolve any disputes. Whatever your concern, we're committed to providing you with the best possible support experience.`,
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
            <h1 className="text-lg font-bold text-white">About Us</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Introduction Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: theme.colors.primary }}>
            Welcome to DriveOn
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Your trusted partner for seamless car rental experiences
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: theme.colors.primary }}>
                {section.title}
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </div>
            </section>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r rounded-lg p-8 md:p-12" style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%)` }}>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-white/90 mb-6 text-lg">
              Join thousands of satisfied users and experience the future of car rental
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                style={{ color: theme.colors.primary }}
              >
                Sign Up Now
              </button>
              <button
                onClick={() => navigate('/cars')}
                className="px-6 py-3 bg-white/10 text-white border-2 border-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
              >
                Browse Cars
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© {currentYear} DriveOn. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
};

export default AboutUsPage;

