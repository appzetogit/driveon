import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authenticateAdmin } from '../middleware/admin.middleware.js';
import {
  createTicket,
  getUserTickets,
  getTicketById,
  addMessage,
  getAllTickets,
  getTicketByIdAdmin,
  updateTicketStatus,
  addAdminResponse,
} from '../controllers/support.controller.js';

const router = express.Router();

// ============================================
// USER ROUTES - Requires user authentication
// ============================================

// Create new ticket
router.post('/tickets', authenticate, createTicket);

// Get all tickets for logged-in user
router.get('/tickets', authenticate, getUserTickets);

// Get ticket by ID
router.get('/tickets/:ticketId', authenticate, getTicketById);

// Add message to ticket
router.post('/tickets/:ticketId/messages', authenticate, addMessage);

export default router;

