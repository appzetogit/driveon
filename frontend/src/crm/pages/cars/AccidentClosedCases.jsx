import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdSearch, 
  MdFilterList, 
  MdDownload, 
  MdCheckCircle,
  MdAttachMoney,
  MdCalendarToday
} from 'react-icons/md';
import ThemedDropdown from '../../components/ThemedDropdown';

// Mock Data for Closed Cases
const MOCK_CLOSED_CASES = [
  { 
      id: 1, 
      car: "Maruti Swift Dzire", 
      reg: "PB 10 5678", 
      date: "10 Aug 2025", 
      insurer: "ICICI Lombard",
      finalCost: "₹ 40,000", 
      recovered: "₹ 35,000", 
      netLoss: "₹ 5,000",
      status: "Settled"
  },
  { 
      id: 2, 
      car: "Toyota Innova Crysta", 
      reg: "PB 01 1234", 
      date: "12 Feb 2025", 
      insurer: "Tata AIG",
      finalCost: "₹ 1,20,000", 
      recovered: "₹ 1,00,000", 
      netLoss: "₹ 20,000",
      status: "Settled"
  },
  { 
      id: 3, 
      car: "Mahindra Thar", 
      reg: "PB 65 9876", 
      date: "05 Jan 2025", 
      insurer: "HDFC Ergo",
      finalCost: "₹ 15,000", 
      recovered: "₹ 15,000", 
      netLoss: "₹ 0",
      status: "Full Recovery"
  },
];

const AccidentClosedCases = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [yearFilter, setYearFilter] = useState('Year: 2025');
    const [insurerFilter, setInsurerFilter] = useState('Insurer: All');
    const [allCases, setAllCases] = useState([]);

    // Load cases on mount
    React.useEffect(() => {
        // Get closed cases from localStorage
        const localStorageCases = JSON.parse(localStorage.getItem('closedAccidentCases') || '[]');
        
        // Combine with mock data, prioritizing localStorage (newer cases)
        const combined = [...localStorageCases, ...MOCK_CLOSED_CASES];
        
        setAllCases(combined);
    }, []);

    const filteredCases = allCases.filter(item => {
        const cleanSearch = searchTerm.trim().toLowerCase();
        return (
            item.car.toLowerCase().includes(cleanSearch) || 
            item.reg.toLowerCase().includes(cleanSearch)
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
              <span className="text-gray-800 font-medium">Closed Cases</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Closed & Settled Cases</h1>
            <p className="text-gray-500 text-sm">History of resolved accidents and financial settlements.</p>
          </div>

        </div>
  
        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search Vehicle or Reg No..." 
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.trimStart())}
                />
            </div>
            <div className="flex gap-3">
               <div className="relative">
                   <MdCalendarToday className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <ThemedDropdown
                     options={['Year: 2025', 'Year: 2024']}
                     value={yearFilter}
                     onChange={(val) => setYearFilter(val)}
                     className="bg-white text-sm"
                     width="w-40"
                   />
               </div>
               <div className="relative">
                   <MdFilterList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <ThemedDropdown
                     options={['Insurer: All', 'Tata AIG', 'HDFC Ergo', 'ICICI Lombard']}
                     value={insurerFilter}
                     onChange={(val) => setInsurerFilter(val)}
                     className="bg-white text-sm"
                     width="w-48"
                   />
               </div>
            </div>
        </div>
  
        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Vehicle</th>
                <th className="p-4">Incident Date</th>
                <th className="p-4">Final Cost</th>
                <th className="p-4">Recovered</th>
                <th className="p-4">Net Loss</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredCases.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{item.car}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.reg}</div>
                  </td>
                  <td className="p-4 text-gray-600 font-medium">
                     {item.date}
                  </td>
                  <td className="p-4 font-bold text-gray-900">
                     {item.finalCost}
                  </td>
                  <td className="p-4 font-bold text-green-600">
                     {item.recovered}
                  </td>
                  <td className="p-4">
                     <span className={`font-bold ${item.netLoss === '₹ 0' ? 'text-gray-400' : 'text-red-600'}`}>
                         {item.netLoss}
                     </span>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-1.5">
                         <MdCheckCircle className="text-green-500" />
                         <span className="font-medium text-gray-700">{item.status}</span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCases.length === 0 && (
            <div className="p-10 text-center text-gray-500">
                No closed cases found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    );
};

export default AccidentClosedCases;
