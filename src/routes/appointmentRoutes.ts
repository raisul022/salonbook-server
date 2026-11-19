import { Router } from 'express';
import {
  createAppointment,
  getCustomerAppointments,
  cancelAppointmentCustomer,
  getAllAppointmentsAdmin,
  confirmAppointmentAdmin,
  cancelAppointmentAdmin,
  getAppointmentDetails,
} from '../controllers/appointmentController.js';
import {
  authenticateToken,
  requireAdmin,
  requireCustomer,
} from '../middleware/auth.js';

const router = Router();

// Customer actions
router.post('/', authenticateToken, requireCustomer, createAppointment);
router.get('/my', authenticateToken, requireCustomer, getCustomerAppointments);
router.patch('/:id/cancel', authenticateToken, requireCustomer, cancelAppointmentCustomer);

// Admin actions
router.get('/admin/all', authenticateToken, requireAdmin, getAllAppointmentsAdmin);
router.patch('/admin/:id/confirm', authenticateToken, requireAdmin, confirmAppointmentAdmin);
router.patch('/admin/:id/cancel', authenticateToken, requireAdmin, cancelAppointmentAdmin);

// View single appointment (Customer owner or Admin)
router.get('/:id', authenticateToken, getAppointmentDetails);

export default router;
