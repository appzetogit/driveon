import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiHeadphones, FiMail, FiPhone,
  FiMessageCircle, FiFileText, FiShield, FiHelpCircle
} from 'react-icons/fi';
import api from '../../services/api';
import { commonService } from '../../services/common.service';

/**
 * PublicSupportPage
 * Public support page for User App - accessible without login.
 * Dynamic settings and live FAQs.
 */
const PublicSupportPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    supportPhone: '+91 99939 11855',
    supportEmail: 'support@driveon.in',
    whatsappNumber: '919993911855',
  });
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupportData = async () => {
      setLoading(true);
      try {
        const [settingsRes, faqsRes] = await Promise.all([
          api.get('/common/settings').catch(() => null),
          commonService.getFAQs().catch(() => null)
        ]);

        if (settingsRes?.data?.settings) {
          const s = settingsRes.data.settings;
          setSettings({
            supportPhone: s.supportPhone || s.emergencyPhone || s.phone || '+91 99939 11855',
            supportEmail: s.supportEmail || s.email || 'support@driveon.in',
            whatsappNumber: s.whatsappNumber || (s.supportPhone ? s.supportPhone.replace(/\D/g, '') : '919993911855'),
          });
        }

        if (faqsRes?.data?.faqs && Array.isArray(faqsRes.data.faqs)) {
          setFaqs(faqsRes.data.faqs.map(f => ({ q: f.question, a: f.answer })));
        } else if (Array.isArray(faqsRes?.faqs)) {
          setFaqs(faqsRes.faqs.map(f => ({ q: f.question, a: f.answer })));
        } else {
          setFaqs([]);
        }
      } catch (error) {
        console.error('Error fetching support data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSupportData();
  }, []);

  const cleanPhone = settings.supportPhone.replace(/\s+/g, '');
  const cleanWhatsapp = settings.whatsappNumber.replace(/\D/g, '');

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
              title="24/7 Helpline"
              desc={settings.supportPhone}
              action="Call Now"
              link={`tel:${cleanPhone}`}
              actionColor="bg-red-500"
            />
            <SupportCard
              icon={<FiMail size={22} className="text-blue-500" />}
              title="Email Support"
              desc={settings.supportEmail}
              action="Send Email"
              link={`mailto:${settings.supportEmail}`}
              actionColor="bg-blue-600"
            />
            <SupportCard
              icon={<FiMessageCircle size={22} className="text-green-500" />}
              title="WhatsApp Support"
              desc="Chat with our support team"
              action="WhatsApp"
              link={`https://wa.me/${cleanWhatsapp}`}
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
          {loading ? (
            <div className="py-6 text-center text-gray-400 text-sm">Loading FAQs...</div>
          ) : faqs.length === 0 ? (
            <div className="py-6 text-center text-gray-400 text-sm">No FAQs available right now.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {faqs.map((faq, i) => (
                <FaqItem key={i} question={faq.q} answer={faq.a} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Policy Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4 text-[#1C205C]">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FiFileText />
            </div>
            <h3 className="font-bold text-lg">Legal & Policies</h3>
          </div>
          <div className="space-y-2">
            <PolicyLink
              title="Privacy Policy"
              desc="How we handle and protect your personal data"
              icon={<FiShield className="text-blue-500" />}
              onClick={() => navigate('/privacy-policy')}
            />
            <PolicyLink
              title="Terms & Conditions"
              desc="Rules and guidelines for using DriveOn"
              icon={<FiFileText className="text-purple-500" />}
              onClick={() => navigate('/terms')}
            />
          </div>
        </motion.div>

        {/* App Version / Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs text-gray-400 font-medium">DriveOn Mobility • Version 1.0.0</p>
          <p className="text-[11px] text-gray-300 mt-1">Regulated under Motor Vehicles Act, 1988</p>
        </div>

      </div>
    </div>
  );
};

const SupportCard = ({ icon, title, desc, action, link, actionColor }) => (
  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs">
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm text-[#1C205C]">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
    <a
      href={link}
      target={link.startsWith('http') ? '_blank' : '_self'}
      rel="noopener noreferrer"
      className={`${actionColor} text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs hover:opacity-90 active:scale-95 transition-all`}
    >
      {action}
    </a>
  </div>
);

const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between gap-3 text-sm font-semibold text-[#1C205C]"
      >
        <span>{question}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <p className="text-xs text-gray-600 mt-2 leading-relaxed pl-1 border-l-2 border-blue-500">
          {answer}
        </p>
      )}
    </div>
  );
};

const PolicyLink = ({ title, desc, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-between hover:bg-gray-100/80 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-xs">
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm text-[#1C205C]">{title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
    <span className="text-gray-400 text-sm font-bold">›</span>
  </button>
);

export default PublicSupportPage;
