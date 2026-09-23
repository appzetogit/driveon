import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MdPersonAdd, 
  MdCheckCircle, 
  MdCancel, 
  MdAccessTime, 
  MdAttachMoney,
  MdEvent,
  MdSearch,
  MdFilterList
} from 'react-icons/md';
import { premiumColors } from '../../theme/colors';

// MOCK DATA: Staff
const MOCK_STAFF = [
  { id: 1, name: 'Rajesh Kumar', role: 'Driver', salaryPerDay: 800, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Suresh Patel', role: 'Mechanic', salaryPerDay: 1200, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Amit Singh', role: 'Manager', salaryPerDay: 2500, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Vikram Malhotra', role: 'Driver', salaryPerDay: 850, status: 'On Leave', avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, name: 'Deepak Verma', role: 'Cleaner', salaryPerDay: 500, status: 'Active', avatar: 'https://i.pravatar.cc/150?u=5' },
];

// MOCK DATA: Attendance (Last 7 days for one person essentially, but here mapped generally)
const ATTENDANCE_MOCK = {
  1: { '2023-12-25': 'P', '2023-12-26': 'P', '2023-12-27': 'P' }, // P=Present
  2: { '2023-12-25': 'P', '2023-12-26': 'A', '2023-12-27': 'P' }, // A=Absent
  3: { '2023-12-25': 'H', '2023-12-26': 'P', '2023-12-27': 'P' }, // H=Half Day
};

const StaffDirectory = ({ searchTerm, setSearchTerm }) => {
  const filteredStaff = MOCK_STAFF.filter(staff => {
      const cleanSearch = searchTerm.trim().toLowerCase();
      return (
          staff.name.toLowerCase().includes(cleanSearch) || 
          staff.role.toLowerCase().includes(cleanSearch)
      );
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                  type="text"
                  placeholder="Search staff members..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value.trimStart())}
              />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">
              <MdFilterList /> Filter
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map(staff => (
          <div key={staff.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
            <img src={staff.avatar} alt={staff.name} className="w-14 h-14 rounded-full object-cover bg-gray-200" />
            <div className="flex-1">
               <div className="flex justify-between items-start">
                 <h3 className="font-bold text-gray-800 text-lg">{staff.name}</h3>
                 <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                   ${staff.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                   {staff.status}
                 </span>
               </div>
               <p className="text-sm text-gray-500 font-medium">{staff.role}</p>
               <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                 Rs. {staff.salaryPerDay}/day
               </div>
            </div>
          </div>
        ))}
        
        {/* Add New Staff Card */}
        <div className="bg-gray-50 rounded-2xl p-5 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer h-full min-h-[140px]">
            <MdPersonAdd size={32} />
            <span className="font-semibold text-sm mt-2">Add New Staff</span>
        </div>
      </div>

      {filteredStaff.length === 0 && (
          <div className="p-10 text-center text-gray-500 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              No staff found matching "{searchTerm}"
          </div>
      )}
    </div>
  );
};

const AttendanceTracker = ({ currentDate }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
    {/* Toolbar */}
    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <div className="flex items-center gap-2">
         <button className="text-gray-500 hover:text-gray-800">&lt;</button>
         <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
           <MdEvent className="text-blue-600" />
           <span className="font-semibold text-gray-700 text-sm">Today, {currentDate}</span>
         </div>
         <button className="text-gray-500 hover:text-gray-800">&gt;</button>
      </div>
      <div className="flex gap-2">
         <button className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 rounded-lg border border-green-200">Mark All Present</button>
      </div>
    </div>

    {/* List */}
    <div className="divide-y divide-gray-100">
      {MOCK_STAFF.map(staff => (
        <div key={staff.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                 {staff.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-800">{staff.name}</p>
                <p className="text-xs text-gray-500">{staff.role}</p>
              </div>
           </div>
           
           {/* Attendance Actions */}
           <div className="flex gap-2">
              <button className="flex flex-col items-center gap-1 group">
                 <div className="w-8 h-8 rounded-full border border-green-200 bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">P</div>
                 <span className="text-[10px] text-gray-400 font-medium">Present</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                 <div className="w-8 h-8 rounded-full border border-red-200 bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">A</div>
                 <span className="text-[10px] text-gray-400 font-medium">Absent</span>
              </button>
              <button className="flex flex-col items-center gap-1 group">
                 <div className="w-8 h-8 rounded-full border border-amber-200 bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">H</div>
                 <span className="text-[10px] text-gray-400 font-medium">Half Day</span>
              </button>
           </div>
        </div>
      ))}
    </div>
  </div>
);

const PayrollPreview = () => (
  <div className="space-y-6">
     {/* Stats */}
     <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
           <p className="text-xs text-blue-500 uppercase font-bold">Total Payable</p>
           <p className="text-2xl font-bold text-blue-900 mt-1">Rs. 1,45,000</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
           <p className="text-xs text-green-500 uppercase font-bold">Paid</p>
           <p className="text-2xl font-bold text-green-900 mt-1">Rs. 45,000</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
           <p className="text-xs text-red-500 uppercase font-bold">Pending</p>
           <p className="text-2xl font-bold text-red-900 mt-1">Rs. 1,00,000</p>
        </div>
     </div>

     {/* Payroll Table */}
     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
           <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
              <tr>
                 <th className="px-5 py-4">Staff Name</th>
                 <th className="px-5 py-4">Days Worked</th>
                 <th className="px-5 py-4">Salary/Day</th>
                 <th className="px-5 py-4">Total Earning</th>
                 <th className="px-5 py-4">Advance</th>
                 <th className="px-5 py-4">Net Payable</th>
                 <th className="px-5 py-4">Status</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100">
              {MOCK_STAFF.map(staff => {
                  // Mock calculation
                  const daysWorked = 25; 
                  const total = daysWorked * staff.salaryPerDay;
                  const advance = Math.floor(Math.random() * 2000);
                  const net = total - advance;

                  return (
                      <tr key={staff.id} className="hover:bg-gray-50">
                         <td className="px-5 py-4 font-medium text-gray-800">{staff.name}</td>
                         <td className="px-5 py-4">{daysWorked}</td>
                         <td className="px-5 py-4">Rs. {staff.salaryPerDay}</td>
                         <td className="px-5 py-4 font-medium">Rs. {total}</td>
                         <td className="px-5 py-4 text-red-500">- Rs. {advance}</td>
                         <td className="px-5 py-4 font-bold text-gray-900">Rs. {net}</td>
                         <td className="px-5 py-4">
                            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold">Pending</span>
                         </td>
                      </tr>
                  )
              })}
           </tbody>
        </table>
     </div>
  </div>
);

const StaffPage = () => {
  const [activeTab, setActiveTab] = useState('Directory'); // Directory, Attendance, Payroll
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Operations</h1>
            <p className="text-gray-500 text-sm">Attendance & Salary</p>
         </div>

         {/* Navigation Tabs */}
         <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
             {['Directory', 'Attendance', 'Payroll'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all
                    ${activeTab === tab 
                      ? 'bg-blue-900 text-white shadow-md' 
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                >
                   {tab}
                </button>
             ))}
         </div>
      </div>

      {/* Dynamic Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
         {activeTab === 'Directory' && <StaffDirectory searchTerm={searchTerm} setSearchTerm={setSearchTerm} />}
         {activeTab === 'Attendance' && <AttendanceTracker currentDate={currentDate} />}
         {activeTab === 'Payroll' && <PayrollPreview />}
      </motion.div>
    </div>
  );
};

export default StaffPage;
