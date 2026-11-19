import { Router } from 'express';
import {
  createCheckoutSession,
  handleStripeWebhook,
  verifyPaymentSession,
  getTransactionsAdmin,
} from '../controllers/paymentController.js';
import {
  authenticateToken,
  requireAdmin,
  requireCustomer,
} from '../middleware/auth.js';

const router = Router();

// Customer: Create checkout session
router.post('/create-checkout-session', authenticateToken, requireCustomer, createCheckoutSession);

// Fallback session verification (e.g. from success page redirect)
router.get('/verify-session', authenticateToken, verifyPaymentSession);

// Admin: View all payment transactions
router.get('/admin/transactions', authenticateToken, requireAdmin, getTransactionsAdmin);

// Stripe webhook (public, signature verified)
router.post('/webhook', handleStripeWebhook);

export default router;
