import React from 'react';
import { motion } from 'framer-motion';
import { FiCode, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const EmployeeLicensesPage = () => {
  const navigate = useNavigate();

  const licenses = [
    { name: 'React', version: '18.x', license: 'MIT', url: 'https://reactjs.org' },
    { name: 'React Router', version: '6.x', license: 'MIT', url: 'https://reactrouter.com' },
    { name: 'Redux Toolkit', version: '2.x', license: 'MIT', url: 'https://redux-toolkit.js.org' },
    { name: 'Framer Motion', version: '11.x', license: 'MIT', url: 'https://www.framer.com/motion' },
    { name: 'Axios', version: '1.x', license: 'MIT', url: 'https://axios-http.com' },
    { name: 'Tailwind CSS', version: '3.x', license: 'MIT', url: 'https://tailwindcss.com' },
    { name: 'React Icons', version: '5.x', license: 'MIT', url: 'https://react-icons.github.io' },
    { name: 'React Hot Toast', version: '2.x', license: 'MIT', url: 'https://react-hot-toast.com' },
    { name: 'Firebase', version: '10.x', license: 'Apache-2.0', url: 'https://firebase.google.com' },
    { name: 'Razorpay', version: 'Latest', license: 'Proprietary', url: 'https://razorpay.com' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans selection:bg-blue-100 flex flex-col">
      {/* HEADER */}
      <div className="bg-[#1C205C] pt-12 pb-16 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center justify-between">
            <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
                <FiArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white tracking-wide">Third-Party Licenses</h1>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
                <FiCode size={20} />
            </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 -mt-8 z-10 space-y-6 flex-1 pb-10 max-w-3xl mx-auto w-full">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4"
        >
            <div className="text-center pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-[#1C205C]">Third-Party Licenses</h2>
                <p className="text-gray-500 text-sm mt-1">Open source libraries used in this app</p>
            </div>

            <div className="space-y-3">
              {licenses.map((lib, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-bold text-[#1C205C] text-sm">{lib.name}</h4>
                    <p className="text-xs text-gray-500">v{lib.version}</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">
                    {lib.license}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                    This app uses open-source software. We are grateful to the developers and communities behind these projects.
                </p>
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeLicensesPage;
