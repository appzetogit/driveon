import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MdSettings, 
  MdLocationOn, 
  MdSecurity, 
  MdNotifications, 
  MdBackup, 
  MdBuild,
  MdCalculate,
  MdNoteAdd,
  MdCloudDownload
} from 'react-icons/md';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('Settings');

  const SETTINGS_SECTIONS = [
    { 
      id: 'General', 
      title: 'General Settings', 
      icon: <MdSettings />, 
      desc: 'App name, Logo, Theme',
      items: ['Business Profile', 'Currency & Tax', 'Date & Time Support']
    },
    { 
      id: 'Locations', 
      title: 'Cities & Locations', 
      icon: <MdLocationOn />, 
      desc: 'Manage service areas',
      items: ['Active Cities', 'Pickup Points', 'Delivery Zones']
    },
    { 
      id: 'Roles', 
      title: 'Roles & Permissions', 
      icon: <MdSecurity />, 
      desc: 'Staff access limits',
      items: ['Admin', 'Manager', 'Driver', 'Accountant']
    },
    { 
      id: 'Notifications', 
      title: 'Alerts & Notifications', 
      icon: <MdNotifications />, 
      desc: 'Email, SMS, Push',
      items: ['Booking Alerts', 'Payment Reminders', 'Staff Alerts']
    },
    { 
      id: 'Backup', 
      title: 'Data & Backup', 
      icon: <MdBackup />, 
      desc: 'Export & Restore',
      items: ['Daily Backup', 'Export All Data', 'System Logs']
    },
  ];

  const TOOLS_SECTIONS = [
    {
      id: 'Export',
      title: 'Data Export Center',
      icon: <MdCloudDownload />,
      desc: 'Download CSV/PDF reports',
      action: 'Open Export Tool'
    },
    {
      id: 'Calculator',
      title: 'Profit Calculator',
      icon: <MdCalculate />,
      desc: 'Estimate margin per car',
      action: 'Launch Calculator'
    },
    {
      id: 'Notes',
      title: 'Quick Notes',
      icon: <MdNoteAdd />,
      desc: 'Private admin notes',
      action: 'View Notes'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings & Tools</h1>
        <p className="text-gray-500 text-sm">System configuration and utilities</p>
      </div>

      {/* 1. Global Settings Grid */}
      <section>
         <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MdSettings className="text-gray-400" /> System Configuration
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SETTINGS_SECTIONS.map((section, idx) => (
               <motion.div 
                 key={section.id} 
                 whileHover={{ y: -5 }}
                 className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
               >
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-700 text-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors mb-4">
                     {section.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg mb-1">{section.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{section.desc}</p>
                  
                  <div className="space-y-2">
                     {section.items.map(item => (
                        <div key={item} className="text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                           {item}
                        </div>
                     ))}
                  </div>
               </motion.div>
            ))}
         </div>
      </section>

      {/* 2. Tools & Utilities */}
      <section>
         <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MdBuild className="text-gray-400" /> Business Tools
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TOOLS_SECTIONS.map((tool, idx) => (
               <motion.div 
                 key={tool.id} 
                 whileHover={{ scale: 1.02 }}
                 className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                     <span className="text-6xl">{tool.icon}</span>
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-between min-h-[140px]">
                     <div>
                        <div className="text-3xl mb-3 text-blue-400 opacity-90">{tool.icon}</div>
                        <h3 className="font-bold text-xl">{tool.title}</h3>
                        <p className="text-sm opacity-60 mt-1">{tool.desc}</p>
                     </div>
                     <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm py-2 px-4 rounded-lg text-sm font-semibold mt-4 w-fit transition-colors">
                        {tool.action}
                     </button>
                  </div>
               </motion.div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default SettingsPage;
