import { Router } from 'express';
import { getCustomerStats, getAdminStats } from '../controllers/statsController.js';
import {
  authenticateToken,
  requireAdmin,
  requireCustomer,
} from '../middleware/auth.js';

const router = Router();

router.get('/customer', authenticateToken, requireCustomer, getCustomerStats);
router.get('/admin', authenticateToken, requireAdmin, getAdminStats);

export default router;
