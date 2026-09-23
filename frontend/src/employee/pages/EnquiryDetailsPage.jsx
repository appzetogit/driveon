import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { 
  FiArrowLeft, FiEdit2, FiPhone, FiMessageSquare, FiFileText, 
  FiUser, FiMapPin, FiCalendar, FiCreditCard, FiCheckCircle, FiAlertCircle 
} from 'react-icons/fi';
import BottomNav from '../components/BottomNav';


// Expanded Dummy Data simulating a database removed to fetch from API

const EnquiryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Enquiry');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnquiryDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/crm/enquiries/${id}`);
        if (response.data.success) {
          const enq = response.data.data;
          
          // Map backend Enquiry to page format
          const formatted = {
            id: enq._id || enq.id,
            name: enq.name,
            phone: enq.phone,
            email: enq.email || 'N/A',
            status: enq.status,
            date: enq.createdAt ? new Date(enq.createdAt).toLocaleDateString('en-GB') : '',
            model: enq.carInterested?.brand ? `${enq.carInterested.brand} ${enq.carInterested.model}` : (typeof enq.carInterested === 'string' ? enq.carInterested : 'Not Specified'),
            source: enq.source || 'Walk-in',
            enquiryId: (enq.enquiryId || enq._id || enq.id || '').toString().slice(-8).toUpperCase(), // slice last 8 chars for a shorter display ID
            category: 'Individual',
            customerType: 'Individual',
            address: 'Not Specified',
            exchange: 'No',
            remark: enq.note || 'No notes added by admin.',
            variant: enq.carInterested?.year || '',
            exteriorColor: enq.carInterested?.color || '',
            interiorColor: '',
            bookingBalance: '0',
            followUps: [],
            booking: null,
            invoice: null,
            feedback: null
          };
          setData(formatted);
        }
      } catch (error) {
        console.error('Error fetching enquiry details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiryDetails();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#1C205C]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C205C]"></div></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Enquiry details not found</div>;

  const handleDownloadInvoice = (invoice) => {
    const doc = new jsPDF();

    // Theme Color
    const themeColor = "#1C205C";

    // Header Area
    doc.setFillColor(themeColor);
    doc.rect(0, 0, 210, 40, 'F'); // A4 Width is 210mm

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 20, { align: "center" });

    // Customer Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 15, 55);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(data.name, 15, 62);
    doc.text(`Model: ${data.model}`, 15, 68);
    if(data.phone) doc.text(`Phone: ${data.phone}`, 15, 74);

    // Invoice Details (Right Side)
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details:", 130, 55);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${invoice.number}`, 130, 62);
    doc.text(`Date: ${invoice.date}`, 130, 68);
    doc.text(`Status: ${invoice.status}`, 130, 74);

    // Line Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 85, 195, 85);

    // Table Header
    doc.setFont("helvetica", "bold");
    doc.text("Description", 15, 95);
    doc.text("Amount", 170, 95, { align: "right" });

    doc.line(15, 100, 195, 100);

    // Table Content
    doc.setFont("helvetica", "normal");
    doc.text(`Booking/Purchase of ${data.model} (${data.variant || 'Standard'})`, 15, 110);
    doc.text(invoice.amount, 170, 110, { align: "right" });

    doc.line(15, 115, 195, 115);

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Total:", 120, 125);
    doc.text(`INR ${invoice.amount}`, 195, 125, { align: "right" });

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for your business!", 105, 150, { align: "center" });
    
    // Save PDF
    doc.save(`Invoice_${invoice.number}.pdf`);
  };

  const tabs = [
    "Enquiry", "Follow Up", "Booking", "Payment", "Invoice", "Feedback"
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 font-sans selection:bg-blue-100 flex flex-col">
      
      {/* HEADER - CLEAN & SIMPLE */}
      <div className="bg-[#1C205C] pt-6 pb-20 px-5 relative z-10">
        <div className="flex justify-between items-center text-white mb-4">
           <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
             <FiArrowLeft size={20} />
           </button>
           <h1 className="text-lg font-bold tracking-wide">Enquiry Details</h1>
           <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
             <FiEdit2 size={18} />
           </button>
        </div>
      </div>

      {/* OVERLAPPING SUMMARY CARD */}
      <div className="px-5 -mt-16 z-20 relative mb-2">
         <div className="bg-white rounded-[20px] p-5 shadow-lg border border-gray-100 relative overflow-hidden flex justify-between items-start">
            {/* Red Accent Line */}
            <div className="absolute left-0 top-5 bottom-5 w-1.5 bg-red-500 rounded-r-full"></div>
            
            <div className="pl-4">
               <h2 className="text-xl font-bold text-[#1C205C] mb-0.5 leading-tight">{data.name}</h2>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{data.model}</p>
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">{data.source}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{data.date}</span>
               </div>
            </div>

            {/* Call Action */}
            <button onClick={() => window.open(`tel:${data.phone}`)} className="w-11 h-11 bg-green-50 rounded-full flex items-center justify-center text-green-600 shadow-sm border border-green-100 active:scale-95 transition-all mt-1">
               <FiPhone size={20} />
            </button>
         </div>
      </div>

      {/* TABS - INCREASED SPACING */}
      <div className="bg-transparent sticky top-0 z-30 pt-2 pb-1 bg-[#F5F7FA]">
         <div className="flex overflow-x-auto px-5 py-2 scrollbar-hide gap-8 bg-transparent">
            {tabs.map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`pb-2 text-sm font-medium whitespace-nowrap transition-all border-b-[3px] rounded-sm
                   ${activeTab === tab ? 'border-[#1C205C] text-[#1C205C] font-bold' : 'border-transparent text-gray-400'}`}
               >
                 {tab}
               </button>
            ))}
         </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="px-5 py-4 flex-1">
        <AnimatePresence mode='wait'>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'Enquiry' && (
               <div className="space-y-4">
                  {/* Basic Info Group */}
                  <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100">
                     <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <DetailItem label="Enquiry ID" value={data.enquiryId} fullWidth />
                        <DetailItem label="Source" value={data.source} />
                        <DetailItem label="Category" value={data.category} />
                        <DetailItem label="Customer Type" value={data.customerType} />
                        <DetailItem label="Exchange" value={data.exchange} />
                     </div>
                  </div>

                  {/* Contact Info Group */}
                  <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100">
                     <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">Contact Details</h3>
                     <div className="space-y-5">
                        <DetailItem label="Mobile Number" value={data.phone} highlight />
                        <DetailItem label="Email" value={data.email} />
                        <DetailItem label="Address" value={data.address} />
                     </div>
                  </div>

                  {/* Admin Note */}
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                     <p className="text-[10px] text-blue-400 font-bold uppercase mb-1">Admin Note</p>
                     <p className="text-sm text-[#1C205C] font-medium leading-relaxed">{data.remark}</p>
                  </div>
               </div>
            )}
            
            {activeTab === 'Follow Up' && (
                <div className="space-y-4">
                    {data.followUps && data.followUps.length > 0 ? (
                        data.followUps.map((item) => (
                           <div key={item.id} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex gap-4">
                               <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                   <FiCalendar size={18} />
                               </div>
                               <div>
                                   <p className="text-[#1C205C] font-bold text-sm">{item.type} <span className="text-gray-400 font-normal ml-1">| {item.date}</span></p>
                                   <p className="text-gray-600 text-xs mt-1 leading-normal">{item.note}</p>
                                   <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-500'}`}>
                                       {item.status}
                                   </span>
                               </div>
                           </div>
                        ))
                    ) : (
                        <div className="bg-white p-10 rounded-[20px] shadow-sm border border-gray-100 text-center">
                           <p className="text-gray-400 text-sm font-medium">No follow-ups recorded.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'Booking' && (
               <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 text-center min-h-[250px] flex flex-col justify-center items-center">
                  {data.booking ? (
                      <div className="w-full text-left space-y-6">
                          <DetailItem label="Booking ID" value={data.booking.id} />
                          <DetailItem label="Booking Date" value={data.booking.date} />
                          <DetailItem label="Status" value={data.booking.status} highlight />
                          <DetailItem label="Amount Paid" value={`₹ ${data.booking.amountPaid}`} />
                      </div>
                  ) : (
                      <>
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
                            <FiAlertCircle size={28} />
                        </div>
                        <p className="text-red-500 font-bold text-base">Data Not Found</p>
                        <p className="text-xs text-gray-400 mt-1">No booking record exists.</p>
                      </>
                  )}
               </div>
            )}

            {activeTab === 'Payment' && (
               <div className="space-y-4">
                  <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100">
                     <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">Vehicle Details</h3>
                     <div className="grid grid-cols-2 gap-y-5">
                       <DetailItem label="Model" value={data.model} />
                       <DetailItem label="Variant" value={data.variant} />
                       <DetailItem label="Exterior Color" value={data.exteriorColor} />
                       <DetailItem label="Interior Color" value={data.interiorColor} />
                     </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100">
                     <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-wider">Payment Summary</h3>
                     <DetailItem label="Booking Balance" value={`₹ ${data.bookingBalance}`} highlight />
                  </div>
               </div>
            )}
            
            {activeTab === 'Invoice' && (
               <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 text-center min-h-[200px] flex flex-col justify-center items-center">
                   {data.invoice ? (
                       <div className="w-full text-left space-y-6">
                           <DetailItem label="Invoice Number" value={data.invoice.number} />
                           <DetailItem label="Invoice Date" value={data.invoice.date} />
                           <DetailItem label="Total Amount" value={`₹ ${data.invoice.amount}`} highlight />
                           <button 
                             onClick={() => handleDownloadInvoice(data.invoice)}
                             className="w-full mt-4 flex items-center justify-center gap-2 bg-[#1C205C] text-white py-3 rounded-xl shadow-lg border border-transparent active:scale-95 transition-all text-sm font-bold"
                           >
                               <FiFileText /> Download Invoice
                           </button>
                       </div>
                   ) : (
                       <>
                           <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
                               <FiFileText size={28} />
                           </div>
                           <p className="text-gray-500 font-bold text-base">No Invoice Generated</p>
                       </>
                   )}
               </div>
            )}
            
            {activeTab === 'Feedback' && (
               <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100">
                   {data.feedback ? (
                       <div className="text-center">
                           <div className="flex justify-center gap-1 mb-4 text-amber-400 text-2xl">
                               {[...Array(5)].map((_, i) => (
                                   <span key={i} className={i < data.feedback.rating ? 'text-amber-400' : 'text-gray-200'}>★</span>
                               ))}
                           </div>
                           <p className="text-[#1C205C] font-bold text-lg mb-2">"{data.feedback.comment}"</p>
                           <p className="text-xs text-gray-400">{data.feedback.date}</p>
                       </div>
                   ) : (
                       <div className="text-center py-8">
                           <p className="text-gray-400 text-sm">No feedback received yet.</p>
                       </div>
                   )}
               </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
};

// Reusable Detail Item Component
const DetailItem = ({ label, value, fullWidth = false, highlight = false }) => (
  <div className={`${fullWidth ? 'col-span-2' : ''}`}>
    <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide mb-1 opacity-80">{label}</p>
    <p className={`text-sm sm:text-base font-bold text-[#1C205C] break-words ${highlight ? 'text-blue-600' : ''}`}>
      {value || '-'}
    </p>
  </div>
);

export default EnquiryDetailsPage;
