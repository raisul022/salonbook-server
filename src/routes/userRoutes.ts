import { Router } from 'express';
import {
  getAllCustomersAdmin,
  getUserDetailsAdmin,
  toggleBlockUserAdmin,
} from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/customers', getAllCustomersAdmin);
router.get('/customers/:id', getUserDetailsAdmin);
router.patch('/customers/:id/toggle-block', toggleBlockUserAdmin);

export default router;
