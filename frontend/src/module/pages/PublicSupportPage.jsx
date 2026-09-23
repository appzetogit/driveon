import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiHeadphones, FiMail, FiPhone,
  FiMessageCircle, FiFileText, FiShield, FiHelpCircle
} from 'react-icons/fi';

/**
 * PublicSupportPage
 * Public support page for User App - accessible without login.
 * Used for Play Store / App Store submission URL.
 * URL: /support
 */
const PublicSupportPage = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      q: 'How do I book a car?',
      a: 'Search for available cars, select your preferred vehicle, choose dates, complete KYC, and confirm booking.'
    },
    {
      q: 'What documents are required for KYC?',
      a: 'You need Aadhaar card, PAN card, and a valid Driving License for KYC verification.'
    },
    {
      q: 'How do I cancel a booking?',
      a: 'Go to My Bookings, select the booking, and tap Cancel. Cancellation policies apply based on timing.'
    },
    {
      q: 'How are refunds processed?',
      a: 'Refunds are processed to the original payment method within 5-7 business days after cancellation approval.'
    },
    {
      q: 'What if I face an issue during my trip?',
      a: 'Call our 24/7 emergency helpline immediately. Our team will assist you with roadside assistance or vehicle replacement.'
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="bg-[#1C205C] pt-12 pb-16 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-wide">Help & Support</h1>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
            <FiHeadphones size={20} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8 z-10 pb-12 space-y-5 max-w-2xl mx-auto w-full">

        {/* Contact Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4 text-[#1C205C]">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FiMessageCircle />
            </div>
            <h3 className="font-bold text-lg">Contact Us</h3>
          </div>
          <div className="space-y-3">
            <SupportCard
              icon={<FiPhone size={22} className="text-red-500" />}
              title="24/7 Emergency Helpline"
              desc="For urgent issues during your trip"
              action="Call Now"
              link="tel:+918000000000"
              actionColor="bg-red-500"
            />
            <SupportCard
              icon={<FiMail size={22} className="text-blue-500" />}
              title="Email Support"
              desc="support@driveoncar.co.in"
              action="Send Email"
              link="mailto:support@driveoncar.co.in"
              actionColor="bg-blue-600"
            />
            <SupportCard
              icon={<FiMessageCircle size={22} className="text-green-500" />}
              title="WhatsApp Support"
              desc="Chat with our support team"
              action="WhatsApp"
              link="https://wa.me/918000000000"
              actionColor="bg-green-500"
            />
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4 text-[#1C205C]">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FiHelpCircle />
            </div>
            <h3 className="font-bold text-lg">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </motion.div>

        {/* Legal Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4 text-[#1C205C]">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FiFileText />
            </div>
            <h3 className="font-bold text-lg">Legal & Policies</h3>
          </div>
          <div className="space-y-1">
            <LegalLink label="Privacy Policy" to="/privacy-policy" navigate={navigate} />
            <LegalLink label="Terms & Conditions" to="/terms" navigate={navigate} />
            <LegalLink label="About DriveOn" to="/about" navigate={navigate} />
          </div>
        </motion.div>

        {/* Login CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1C205C] p-5 rounded-3xl shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
              <FiShield size={16} />
            </div>
            <h3 className="font-bold text-white">Raise a Support Ticket</h3>
          </div>
          <p className="text-white/70 text-sm mb-4">
            Login to create a support ticket and track your issue status with a unique token.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-white text-[#1C205C] font-bold py-3 rounded-2xl text-sm hover:bg-gray-100 transition-colors active:scale-[0.98]"
          >
            Login to Create Ticket
          </button>
        </motion.div>

        <p className="text-center text-xs text-gray-400 pt-2">
          DriveOn Car Rentals · support@driveoncar.co.in
        </p>
      </div>
    </div>
  );
};

const SupportCard = ({ icon, title, desc, action, link, actionColor }) => (
  <div className="flex items-center p-3.5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
      {icon}
    </div>
    <div className="ml-3 flex-1">
      <h4 className="font-bold text-[#1C205C] text-sm">{title}</h4>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`ml-2 px-3 py-1.5 text-white text-xs font-bold rounded-xl ${actionColor} hover:opacity-90 transition-opacity`}
    >
      {action}
    </a>
  </div>
);

const FAQItem = ({ question, answer }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      className="bg-gray-50 rounded-2xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-3.5">
        <p className="font-semibold text-[#1C205C] text-sm flex-1 pr-3">{question}</p>
        <span className={`text-gray-400 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ↓
        </span>
      </div>
      {open && (
        <div className="px-3.5 pb-3.5">
          <p className="text-xs text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
};

const LegalLink = ({ label, to, navigate }) => (
  <button
    onClick={() => navigate(to)}
    className="w-full flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
  >
    <span className="font-bold text-gray-600 text-sm group-hover:text-[#1C205C] transition-colors">{label}</span>
    <span className="text-gray-300 group-hover:text-blue-500 transition-colors">↗</span>
  </button>
);

export default PublicSupportPage;
