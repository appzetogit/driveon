import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';

const DAMAGE_DATA = [
  { name: 'Major', value: 40, color: '#ef4444' }, // Red
  { name: 'Medium', value: 35, color: '#f97316' }, // Orange
  { name: 'Minor', value: 25, color: '#eab308' }, // Yellow
];

const COST_TREND_DATA = [
  { month: 'Jul', cost: 45000 },
  { month: 'Aug', cost: 52000 },
  { month: 'Sep', cost: 38000 },
  { month: 'Oct', cost: 65000 },
  { month: 'Nov', cost: 48000 },
  { month: 'Dec', cost: 72000 },
];

const DamageCharts = () => {
  return (
    <div className="space-y-6">
       {/* Severity Pie Chart */}
       <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-4">Damage Severity Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={DAMAGE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {DAMAGE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
               </PieChart>
            </ResponsiveContainer>
          </div>
       </div>

       {/* Cost Line Chart */}
       <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-700 font-bold text-sm uppercase tracking-wider mb-4">Repair Cost Trends (6 Months)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={COST_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                     contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                     formatter={(value) => [`₹ ${value.toLocaleString()}`, 'Cost']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
               </LineChart>
            </ResponsiveContainer>
          </div>
       </div>
    </div>
  );
};

export default DamageCharts;
