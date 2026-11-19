import { Router } from 'express';
import {
  getServices,
  getServiceById,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from '../controllers/serviceController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public routes
router.get('/', getServices);
router.get('/:id', getServiceById);

// Admin protected routes
router.get('/admin/all', authenticateToken, requireAdmin, getAllServicesAdmin);
router.post('/admin/create', authenticateToken, requireAdmin, createService);
router.put('/admin/:id', authenticateToken, requireAdmin, updateService);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteService);
router.patch('/admin/:id/toggle-status', authenticateToken, requireAdmin, toggleServiceStatus);

export default router;
