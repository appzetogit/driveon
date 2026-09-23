import SupportTicket from '../models/SupportTicket.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * Create a new support ticket (User)
 */
export const createTicket = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Ensure userId is ObjectId
    let userIdObjectId;
    if (userId instanceof mongoose.Types.ObjectId) {
      userIdObjectId = userId;
    } else if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    const { subject, category, description, priority } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Subject and description are required',
      });
    }

    // Get user details - explicitly select name, email, and phone fields
    const user = await User.findById(userId).select('name email phone');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Extract user information with proper fallbacks
    // Name: Use name if it exists and is not empty, otherwise use email, then phone, then 'User'
    const userName = (user.name && user.name.trim()) 
      ? user.name.trim() 
      : (user.email ? user.email : (user.phone ? user.phone : 'User'));
    
    // Email: Use email if available, otherwise use phone, otherwise empty string
    const userEmail = user.email 
      ? user.email.trim().toLowerCase() 
      : (user.phone ? user.phone.trim() : '');

    // Log user information for debugging
    console.log('Creating ticket with user info:', {
      userId: userIdObjectId.toString(),
      userName,
      userEmail,
      userFromDB: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });

    // Create ticket (token will be auto-generated in pre-save hook)
    const ticket = new SupportTicket({
      userId: userIdObjectId,
      userName: userName,
      userEmail: userEmail,
      subject: subject.trim(),
      category: category || 'general',
      description: description.trim(),
      priority: priority || 'medium',
      status: 'open',
      messages: [
        {
          sender: 'user',
          senderName: userName,
          message: description.trim(),
        },
      ],
    });

    try {
      await ticket.save();
    } catch (saveError) {
      // If token duplicate error, retry with new token
      if (saveError.code === 11000 && saveError.keyPattern?.token) {
        // Token already exists, generate a new one and retry
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 9).toUpperCase();
        const randomNum = Math.floor(Math.random() * 10000);
        ticket.token = `TK-${timestamp}-${randomStr}-${randomNum}`;
        try {
          await ticket.save();
        } catch (retryError) {
          console.error('Retry save error:', retryError);
          throw retryError;
        }
      } else {
        console.error('Save error:', saveError);
        throw saveError;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticket: {
          id: ticket._id,
          token: ticket.token,
          subject: ticket.subject,
          category: ticket.category,
          status: ticket.status,
          createdAt: ticket.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: error.message,
    });
  }
};

/**
 * Get all tickets for a user
 */
export const getUserTickets = async (req, res) => {
  console.log('=== getUserTickets controller called ===');
  console.log('Request user:', req.user);
  try {
    if (!req.user) {
      console.error('No user in request!');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }
    
    const userId = req.user._id || req.user.id;
    console.log('Getting tickets for userId:', userId);
    console.log('User object:', { 
      _id: req.user._id, 
      _idString: req.user._id?.toString(),
      id: req.user.id 
    });

    // Ensure userId is ObjectId
    let userIdObjectId;
    if (userId instanceof mongoose.Types.ObjectId) {
      userIdObjectId = userId;
    } else if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      console.error('Invalid userId format:', userId);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    console.log('Querying with userIdObjectId:', userIdObjectId.toString());

    // Query with ObjectId - MongoDB will handle the comparison
    // Also try querying with string format as fallback
    let tickets = await SupportTicket.find({ userId: userIdObjectId })
      .sort({ createdAt: -1 })
      .select('-messages')
      .lean();

    // If no tickets found, try with string format
    if (tickets.length === 0) {
      console.log('No tickets found with ObjectId, trying string format...');
      tickets = await SupportTicket.find({ userId: userIdObjectId.toString() })
        .sort({ createdAt: -1 })
        .select('-messages')
        .lean();
    }

    console.log('Found tickets:', tickets.length);
    if (tickets.length > 0) {
      console.log('Sample ticket userId:', tickets[0].userId?.toString());
      console.log('Sample ticket userId type:', typeof tickets[0].userId);
    } else {
      // Debug: Check if any tickets exist for this user
      const allTickets = await SupportTicket.find({}).select('userId').lean();
      console.log('Total tickets in DB:', allTickets.length);
      console.log('All userIds in DB:', allTickets.map(t => t.userId?.toString()));
      console.log('Looking for userId:', userIdObjectId.toString());
    }

    res.status(200).json({
      success: true,
      data: {
        tickets: tickets.map((ticket) => ({
          id: ticket._id.toString(),
          token: ticket.token,
          subject: ticket.subject,
          category: ticket.category,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          userName: ticket.userName || (ticket.userId?.name || ticket.userId?.email || 'User'),
          userEmail: ticket.userEmail || (ticket.userId?.email || ticket.userId?.phone || ''),
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message,
    });
  }
};

/**
 * Get ticket by ID (User)
 */
export const getTicketById = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Ensure userId is ObjectId
    let userIdObjectId;
    if (userId instanceof mongoose.Types.ObjectId) {
      userIdObjectId = userId;
    } else if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId: userIdObjectId,
    }).populate('userId', 'name email phone');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ticket: {
          id: ticket._id.toString(),
          token: ticket.token,
          subject: ticket.subject,
          category: ticket.category,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          userName: ticket.userName || (ticket.userId?.name || ticket.userId?.email || 'User'),
          userEmail: ticket.userEmail || (ticket.userId?.email || ticket.userId?.phone || ''),
          messages: ticket.messages.map((msg) => ({
            id: msg._id.toString(),
            sender: msg.sender,
            senderName: msg.senderName,
            message: msg.message,
            timestamp: msg.createdAt,
          })),
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get ticket by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message,
    });
  }
};

/**
 * Add message to ticket (User)
 */
export const addMessage = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    // Ensure userId is ObjectId
    let userIdObjectId;
    if (userId instanceof mongoose.Types.ObjectId) {
      userIdObjectId = userId;
    } else if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObjectId = new mongoose.Types.ObjectId(userId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }
    
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      userId: userIdObjectId,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Get user details
    const user = await User.findById(userId);

    // Add message
    ticket.messages.push({
      sender: 'user',
      senderName: user?.name || user?.email || 'User',
      message: message.trim(),
    });

    ticket.updatedAt = new Date();
    await ticket.save();

    const newMessage = ticket.messages[ticket.messages.length - 1];

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: {
        message: {
          id: newMessage._id.toString(),
          sender: newMessage.sender,
          senderName: newMessage.senderName,
          message: newMessage.message,
          timestamp: newMessage.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: error.message,
    });
  }
};

/**
 * Get all tickets (Admin)
 */
export const getAllTickets = async (req, res) => {
  try {
    const {
      status,
      category,
      search,
      page = 1,
      limit = 20,
      dateFilter,
      customStartDate,
      customEndDate,
    } = req.query;

    // Build query
    const query = {};

    if (status && status !== 'all') {
      // Normalize status to lowercase for consistent matching
      const normalizedStatus = status.toLowerCase().trim();
      // Map common variations to correct enum values
      const statusMap = {
        'open': 'open',
        'pending': 'pending',
        'in_progress': 'in_progress',
        'in progress': 'in_progress',
        'resolved': 'resolved',
        'closed': 'closed',
      };
      
      const mappedStatus = statusMap[normalizedStatus] || normalizedStatus;
      query.status = mappedStatus;
    }

    if (category && category !== 'all') {
      // Normalize category to lowercase for consistent matching
      query.category = category.toLowerCase();
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { token: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today': {
          // Create a new date for today at 00:00:00
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          startDate = today;
          break;
        }
        case 'week': {
          // Last 7 days from now
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          weekAgo.setHours(0, 0, 0, 0);
          startDate = weekAgo;
          break;
        }
        case 'month': {
          // Last 30 days from now
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          monthAgo.setHours(0, 0, 0, 0);
          startDate = monthAgo;
          break;
        }
        case 'custom': {
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
          } else if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            query.createdAt = { $gte: start };
          } else if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $lte: end };
          }
          break;
        }
        default:
          startDate = null;
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    // Debug logging
    console.log('Admin getAllTickets - Query params:', {
      originalStatus: status,
      originalCategory: category,
      search,
      dateFilter,
      finalQuery: JSON.stringify(query),
      queryKeys: Object.keys(query),
    });

    // Get tickets with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await SupportTicket.countDocuments(query);
    
    // Debug logging for results
    console.log('Admin getAllTickets - Results:', {
      ticketsFound: tickets.length,
      totalCount: total,
      queryUsed: JSON.stringify(query),
    });

    // Get statistics
    const stats = {
      total: await SupportTicket.countDocuments(),
      open: await SupportTicket.countDocuments({ status: 'open' }),
      pending: await SupportTicket.countDocuments({ status: 'pending' }),
      inProgress: await SupportTicket.countDocuments({ status: 'in_progress' }),
      resolved: await SupportTicket.countDocuments({ status: 'resolved' }),
      closed: await SupportTicket.countDocuments({ status: 'closed' }),
    };

    res.status(200).json({
      success: true,
      data: {
        tickets: tickets.map((ticket) => ({
          id: ticket._id.toString(),
          token: ticket.token,
          userId: ticket.userId?._id?.toString() || ticket.userId?.toString(),
          userName: ticket.userName,
          userEmail: ticket.userEmail,
          subject: ticket.subject,
          category: ticket.category,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          messagesCount: ticket.messages?.length || 0,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Get all tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: error.message,
    });
  }
};

/**
 * Get ticket by ID (Admin)
 */
export const getTicketByIdAdmin = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findById(ticketId).populate(
      'userId',
      'name email phone'
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ticket: {
          id: ticket._id.toString(),
          token: ticket.token,
          userId: ticket.userId?._id?.toString() || ticket.userId?.toString(),
          userName: ticket.userName,
          userEmail: ticket.userEmail,
          userPhone: ticket.userId?.phone || '',
          subject: ticket.subject,
          category: ticket.category,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          messages: ticket.messages.map((msg) => ({
            id: msg._id.toString(),
            sender: msg.sender,
            senderName: msg.senderName,
            message: msg.message,
            timestamp: msg.createdAt,
          })),
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt,
          resolvedAt: ticket.resolvedAt,
          closedAt: ticket.closedAt,
        },
      },
    });
  } catch (error) {
    console.error('Get ticket by ID (admin) error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket',
      error: error.message,
    });
  }
};

/**
 * Update ticket status (Admin)
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['open', 'pending', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    ticket.status = status;
    ticket.adminId = adminId;

    if (status === 'resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
    }
    if (status === 'closed' && !ticket.closedAt) {
      ticket.closedAt = new Date();
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: {
        ticket: {
          id: ticket._id.toString(),
          status: ticket.status,
          updatedAt: ticket.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Update ticket status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: error.message,
    });
  }
};

/**
 * Add admin response to ticket
 */
export const addAdminResponse = async (req, res) => {
  try {
    const adminId = req.user?._id || req.user?.id;
    const { ticketId } = req.params;
    const { message, status } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const ticket = await SupportTicket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
    }

    // Get admin details
    const Admin = (await import('../models/Admin.js')).default;
    const admin = await Admin.findById(adminId);

    // Add admin message
    ticket.messages.push({
      sender: 'admin',
      senderName: admin?.name || 'Admin',
      message: message.trim(),
    });

    // Update status if provided
    if (status) {
      ticket.status = status;
      ticket.adminId = adminId;

      if (status === 'resolved' && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
      if (status === 'closed' && !ticket.closedAt) {
        ticket.closedAt = new Date();
      }
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    const newMessage = ticket.messages[ticket.messages.length - 1];

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      data: {
        message: {
          id: newMessage._id.toString(),
          sender: newMessage.sender,
          senderName: newMessage.senderName,
          message: newMessage.message,
          timestamp: newMessage.createdAt,
        },
        ticket: {
          id: ticket._id.toString(),
          status: ticket.status,
          updatedAt: ticket.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error('Add admin response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message,
    });
  }
};

