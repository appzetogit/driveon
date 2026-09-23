import Enquiry from '../models/Enquiry.js';
import RepairJob from '../models/RepairJob.js';
import Attendance from '../models/Attendance.js';
import Staff from '../models/Staff.js';

export const getDashboardStats = async (req, res) => {
    try {
        const now = new Date();

        // Start of Today (00:00:00)
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // End of Today (23:59:59)
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        // Start of Month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Start of Last 7 Days
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Parallel execution for better performance
        const [
            newEnquiriesToday,
            activeRepairs,
            attendanceToday,
            totalStaff,
            convertedLeadsMonth,
            recentEnquiries,
            pipelineStats,
            dailyPulse
        ] = await Promise.all([
            // 1. New Enquiries Today
            Enquiry.countDocuments({
                createdAt: { $gte: today, $lte: endOfDay }
            }),

            // 2. Active Repairs (Not Completed or Cancelled)
            RepairJob.countDocuments({
                status: { $nin: ['Completed', 'Cancelled'] }
            }),

            // 3. Attendance Today
            Attendance.countDocuments({
                date: { $gte: today, $lte: endOfDay },
                status: 'Present'
            }),

            // 4. Total Staff
            Staff.countDocuments({}),

            // 5. Converted Leads This Month
            Enquiry.countDocuments({
                status: 'Converted',
                updatedAt: { $gte: startOfMonth }
            }),

            // 6. Recent Enquiries (Limit 4)
            Enquiry.find()
                .sort({ createdAt: -1 })
                .limit(4)
                .select('name carInterested status createdAt'),

            // 7. Pipeline Data (Group by status)
            Enquiry.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // 8. Weekly Pulse (Last 7 Days)
            Enquiry.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        newCount: { $sum: 1 },
                        convertedCount: {
                            $sum: {
                                $cond: [{ $eq: ["$status", "Converted"] }, 1, 0]
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Process Pipeline Data
        let totalLeads = 0;
        let pipelineMap = {
            Active: 0, // In Progress, Follow-up
            Converted: 0, // Converted
            Pending: 0, // New
        };

        pipelineStats.forEach(stat => {
            totalLeads += stat.count;
            if (['In Progress', 'Follow-up'].includes(stat._id)) {
                pipelineMap.Active += stat.count;
            } else if (stat._id === 'Converted') {
                pipelineMap.Converted += stat.count;
            } else if (stat._id === 'New') {
                pipelineMap.Pending += stat.count;
            }
        });

        // Format Pipeline Data for Chart
        const pipelineChartData = [
            { name: 'Active', value: pipelineMap.Active },
            { name: 'Converted', value: pipelineMap.Converted },
            { name: 'Pending', value: pipelineMap.Pending },
        ];

        // Process Weekly Pulse Data (Ensure all 7 days vary)
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            days.push(dateStr);
        }

        const pulseChartData = days.map(day => {
            const dayData = dailyPulse.find(d => d._id === day);
            const dateObj = new Date(day);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

            return {
                name: dayName,
                new: dayData ? dayData.newCount : 0,
                converted: dayData ? dayData.convertedCount : 0
            };
        });

        res.status(200).json({
            success: true,
            data: {
                stats: {
                    newEnquiries: newEnquiriesToday,
                    activeRepairs: activeRepairs,
                    attendance: {
                        present: attendanceToday,
                        total: totalStaff
                    },
                    convertedLeads: convertedLeadsMonth
                },
                pulse: pulseChartData,
                pipeline: {
                    total: totalLeads,
                    data: pipelineChartData
                },
                recentEnquiries: recentEnquiries
            }
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
