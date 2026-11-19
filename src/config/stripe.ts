import Stripe from 'stripe';
import { ENV } from './env.js';

export const stripe = new Stripe(ENV.STRIPE_SECRET_KEY || 'sk_test_mock_placeholder', {
  apiVersion: '2025-01-27.acacia' as any,
  typescript: true,
});
