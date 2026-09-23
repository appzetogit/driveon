import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdSearch, 
  MdAdd, 
  MdError,
} from 'react-icons/md';
import ThemedDropdown from '../../components/ThemedDropdown';

// Mock Data
const MOCK_ACCIDENTS = [
  { 
     id: 1, 
     car: "Toyota Innova Crysta", 
     reg: "PB 01 1234", 
     date: "26 Dec 2025", 
     location: "Delhi-Agra Hwy",
     severity: "Major", 
     status: "In Repair", 
     image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/115025/innova-crysta-exterior-right-front-three-quarter-3.jpeg?isig=0&q=80" 
  },
  { 
     id: 2, 
     car: "Mahindra Thar", 
     reg: "PB 65 9876", 
     date: "20 Dec 2025", 
     location: "Manali, HP",
     severity: "Medium", 
     status: "Survey Pending", 
     image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/40087/thar-exterior-right-front-three-quarter-11.jpeg?q=80" 
  },
  { 
     id: 3, 
     car: "Maruti Swift Dzire", 
     reg: "PB 10 5678", 
     date: "15 Dec 2025", 
     location: "Chandigarh",
     severity: "Minor", 
     status: "Reported", 
     image: "https://imgd.aeplcdn.com/370x208/n/cw/ec/45691/dzire-exterior-right-front-three-quarter-3.jpeg?q=80" 
  },
];

const AccidentActiveCases = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('Severity: All');
    const [activeCases, setActiveCases] = useState([]);

    // Load active cases on mount
    React.useEffect(() => {
        // Get closed case IDs from localStorage
        const closedCases = JSON.parse(localStorage.getItem('closedAccidentCases') || '[]');
        const closedIds = closedCases.map(c => c.id);
        
        // Filter out closed cases from mock data
        const active = MOCK_ACCIDENTS.filter(accident => !closedIds.includes(accident.id));
        
        setActiveCases(active);
    }, []);

    const getSeverityColor = (severity) => {
        switch(severity) {
            case 'Major': return 'bg-red-50 text-red-700 border-red-200';
            case 'Medium': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'Minor': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const filteredAccidents = activeCases.filter(item => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        return (
            item.car.toLowerCase().includes(cleanSearch) || 
            item.reg.toLowerCase().includes(cleanSearch) ||
            item.location.toLowerCase().includes(cleanSearch)
        );
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/enquiries/all')}>Home</span> 
              <span>/</span> 
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/all')}>Cars</span> 
              <span>/</span> 
              <span className="hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => navigate('/crm/cars/accidents/active')}>Accidents</span> 
              <span>/</span> 
              <span className="text-gray-800 font-medium">Active</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Active Accident Cases</h1>
            <p className="text-gray-500 text-sm">Track and manage ongoing accident claims and repairs.</p>
          </div>
          <button 
            onClick={() => navigate('/crm/cars/accidents/add')}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium shadow-sm hover:bg-red-700 transition-colors"
          >
            <MdAdd size={20} />
            Report New Case
          </button>
        </div>
  
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search car, number..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                />
            </div>
            <div className="flex gap-3">
               <ThemedDropdown
                 options={['Severity: All', 'Major', 'Medium', 'Minor']}
                 value={severityFilter}
                 onChange={(val) => setSeverityFilter(val)}
                 className="bg-white text-sm"
                 width="w-40"
               />
            </div>
        </div>

        {/* Alerts */}
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
            <MdError className="text-red-500 mt-0.5 shrink-0" size={20} />
            <div>
                <h4 className="text-sm font-bold text-red-800">Critical Alerts</h4>
                <p className="text-xs text-red-600 mt-0.5">2 New claims filed today requiring immediate surveyor approval.</p>
            </div>
        </div>
  
        {/* Cards Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccidents.map((item, index) => (
            <div 
                key={item.id} 
                onClick={() => navigate(`/crm/cars/accidents/${item.id}`)}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
            >
               {/* Car Image */}
               <div className="h-48 bg-gray-100 relative overflow-hidden">
                   <img src={item.image} alt={item.car} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute top-3 right-3">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${getSeverityColor(item.severity)}`}>
                          {item.severity} Damage
                       </span>
                   </div>
               </div>
               
               {/* Content */}
               <div className="p-5">
                   <div className="flex justify-between items-start mb-2">
                       <div>
                           <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.car}</h3>
                           <p className="text-sm font-mono text-gray-500 font-medium">{item.reg}</p>
                       </div>
                   </div>
                   
                   <div className="space-y-3 mt-4">
                       <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                           <span className="text-gray-500">Incident Date</span>
                           <span className="font-medium text-gray-800">{item.date}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                           <span className="text-gray-500">Location</span>
                           <span className="font-medium text-gray-800">{item.location}</span>
                       </div>
                       <div className="flex items-center justify-between text-sm pt-1">
                           <span className="text-gray-500">Current Status</span>
                           <span className="font-bold text-indigo-600">{item.status}</span>
                       </div>
                   </div>
               </div>
            </div>
          ))}
        </div>

        {filteredAccidents.length === 0 && (
            <div className="p-10 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                No active accident cases found matching "{searchTerm}"
            </div>
        )}
      </div>
    );
};

export default AccidentActiveCases;
