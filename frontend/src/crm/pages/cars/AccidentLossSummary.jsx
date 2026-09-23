import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdDownload, 
  MdTrendingUp, 
  MdTrendingDown,
  MdAttachMoney,
  MdCheckCircle,
  MdInfo,
  MdDirectionsCar
} from 'react-icons/md';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { rgba } from 'polished';

// --- Mock Data ---
const CHART_DATA = [
  { month: 'Jan', loss: 45000, recovered: 40000 },
  { month: 'Feb', loss: 30000, recovered: 25000 },
  { month: 'Mar', loss: 60000, recovered: 45000 },
  { month: 'Apr', loss: 20000, recovered: 18000 },
  { month: 'May', loss: 80000, recovered: 30000 }, // High loss
  { month: 'Jun', loss: 50000, recovered: 49000 },
  { month: 'Jul', loss: 10000, recovered: 10000 },
  { month: 'Aug', loss: 35000, recovered: 32000 },
  { month: 'Sep', loss: 55000, recovered: 50000 },
  { month: 'Oct', loss: 40000, recovered: 38000 },
  { month: 'Nov', loss: 70000, recovered: 55000 },
  { month: 'Dec', loss: 90000, recovered: 60000 },
];

const TOP_LOSS_VEHICLES = [
  { name: "Toyota Innova Crysta", reg: "PB 01 1234", amount: 120000, severity: "high" },
  { name: "Mahindra Thar", reg: "PB 65 9876", amount: 85000, severity: "medium" },
  { name: "Maruti Swift Dzire", reg: "PB 10 5678", amount: 35000, severity: "low" },
  { name: "Hyundai Creta", reg: "HR 26 1122", amount: 25000, severity: "low" },
];

// --- Sub-Components ---

const KPICard = ({ title, amount, percentage, trend, icon: Icon, color, delay }) => {
  const isPositive = trend === 'up';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
      whileHover={{ scale: 1.02, boxShadow: "0px 10px 20px rgba(0,0,0,0.05)" }}
      className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, white, ${rgba(color, 0.05)})` }}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <Icon size={100} style={{ color }} />
      </div>
      
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-end gap-3 z-10 relative">
         <span className="text-3xl font-bold text-gray-800" style={{ color: color }}>{amount}</span>
         {percentage && <span className="text-xs font-bold mb-1.5 text-gray-400">({percentage})</span>}
      </div>

      <div className={`mt-4 flex items-center gap-1 text-sm font-medium z-10 relative`} style={{ color: isPositive ? '#10B981' : '#EF4444' }}>
          {isPositive ? <MdTrendingUp /> : <MdTrendingDown />}
          <span>{isPositive ? 'Increased' : 'Decreased'} by 12%</span>
      </div>
    </motion.div>
  );
};

const InsightCard = () => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex items-start gap-3 mt-6"
        style={{ backgroundColor: rgba('#3B82F6', 0.05) }}
    >
        <MdInfo className="text-blue-500 shrink-0 mt-0.5" size={24} />
        <div>
            <h4 className="text-blue-900 font-bold text-sm">Actionable Insight</h4>
            <p className="text-blue-700 text-sm mt-1 leading-relaxed">
                Recovery rates dipped in <b>May</b> and <b>December</b>. Analysis suggests high-value claims involving third-party negotiations take longer to settle. Prioritize following up on cases labeled "Under Negotiation".
            </p>
        </div>
    </motion.div>
);

const VehicleLossItem = ({ vehicle, maxVal, index }) => {
    const widthPercent = (vehicle.amount / maxVal) * 100;
    const color = vehicle.severity === 'high' ? '#EF4444' : vehicle.severity === 'medium' ? '#F97316' : '#EAB308';
    
    return (
        <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 * index }}
            className="group"
        >
            <div className="flex justify-between items-center text-sm mb-1.5">
                <div>
                   <span className="font-bold text-gray-700 block">{vehicle.name}</span>
                   <span className="text-gray-400 text-xs">{vehicle.reg}</span>
                </div>
                <span className="font-bold" style={{ color }}>₹ {vehicle.amount.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${widthPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full relative"
                    style={{ backgroundColor: color }}
                >
                   {/* Shine effect */}
                   <div className="absolute top-0 bottom-0 right-0 w-4 bg-white opacity-20 transform skew-x-12 translate-x-full group-hover:animate-ping" />
                </motion.div>
            </div>
        </motion.div>
    );
};

// --- Main Component ---
const AccidentLossSummary = () => {
  const navigate = useNavigate();


  const maxLoss = Math.max(...TOP_LOSS_VEHICLES.map(v => v.amount));

  return (
    <div className="space-y-8 pb-10">
      
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
              <span className="text-gray-800 font-medium">Reports</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Loss & Recovery Summary</h1>
            <p className="text-gray-500 text-sm">Financial performance of accident claims (YTD).</p>
          </div>

      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard 
             title="Total Loss (YTD)" 
             amount="₹ 12.5L" 
             icon={MdTrendingDown} 
             color="#EF4444" 
             trend="up"
             delay={0.1}
          />
          <KPICard 
             title="Recovered Amount" 
             amount="₹ 11.2L" 
             percentage="89.6%" 
             icon={MdCheckCircle} 
             color="#10B981" 
             trend="up"
             delay={0.2}
          />
          <KPICard 
             title="Unrecovered Loss" 
             amount="₹ 1.3L" 
             percentage="10.4%" 
             icon={MdAttachMoney} 
             color="#F97316" 
             trend="down"
             delay={0.3}
          />
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.4 }}
             className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-md h-[450px] flex flex-col"
          >
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-gray-800 text-lg">Monthly Loss vs Recovery</h3>
                 <div className="flex gap-4 text-xs font-medium">
                     <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400"></span> Total Loss</span>
                     <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400"></span> Recovered</span>
                 </div>
             </div>

             <div className="flex-1 w-full h-full">
                 <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={rgba('#000', 0.05)} />
                         <XAxis 
                             dataKey="month" 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                             dy={10}
                         />
                         <YAxis 
                             axisLine={false} 
                             tickLine={false} 
                             tick={{ fill: '#9CA3AF', fontSize: 12 }} 
                             tickFormatter={(val) => `₹${val/1000}k`}
                         />
                         <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                         />
                         <Bar 
                            dataKey="loss" 
                            fill={rgba('#EF4444', 0.8)} 
                            radius={[4, 4, 0, 0]} 
                            barSize={12}
                            animationDuration={1500}
                         />
                         <Bar 
                            dataKey="recovered" 
                            fill={rgba('#10B981', 0.9)} 
                            radius={[4, 4, 0, 0]} 
                            barSize={12}
                            animationDuration={1500}
                         />
                     </BarChart>
                 </ResponsiveContainer>
             </div>
          </motion.div>

          {/* Right Column: Top Vehicles & Insights */}
          <div className="space-y-6">
              <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ duration: 0.5, delay: 0.5 }}
                 className="bg-white p-6 rounded-2xl border border-gray-100 shadow-md"
              >
                  <h3 className="font-bold text-gray-800 text-lg mb-6 flex items-center gap-2">
                      <MdDirectionsCar className="text-indigo-500" />
                      Top Loss Vehicles
                  </h3>
                  <div className="space-y-6">
                      {TOP_LOSS_VEHICLES.map((v, i) => (
                           <VehicleLossItem key={i} vehicle={v} maxVal={maxLoss} index={i} />
                      ))}
                  </div>
              </motion.div>

              <InsightCard />
          </div>

      </div>

    </div>
  );
};

export default AccidentLossSummary;
