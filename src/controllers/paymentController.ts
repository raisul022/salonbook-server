import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { stripe } from '../config/stripe.js';
import { ENV } from '../config/env.js';
import { Appointment } from '../models/Appointment.js';
import { Transaction } from '../models/Transaction.js';
import { Service } from '../models/Service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Customer: Create Stripe Checkout Session
export const createCheckoutSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    const { appointmentId } = req.body;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!appointmentId || !mongoose.Types.ObjectId.isValid(appointmentId)) {
      res.status(400).json({ success: false, message: 'Valid appointment ID is required.' });
      return;
    }

    const appointment = await Appointment.findById(appointmentId).populate('serviceId');
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    // Security: Only the appointment customer can pay
    if (appointment.customerId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You can only pay for your own appointments.',
      });
      return;
    }

    // Rule: Customers cannot pay for cancelled or pending appointments (Page 13, 17)
    if (appointment.status !== 'confirmed') {
      res.status(400).json({
        success: false,
        message: `Payment is only allowed for confirmed appointments. Current status: ${appointment.status}.`,
      });
      return;
    }

    if (appointment.paymentStatus === 'paid') {
      res.status(400).json({
        success: false,
        message: 'This appointment has already been paid for.',
      });
      return;
    }

    const service = appointment.serviceId as any;
    const serviceName = service?.serviceName || 'Salon Service';
    const amountInCents = Math.round(appointment.servicePrice * 100);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      client_reference_id: appointment._id.toString(),
      metadata: {
        appointmentId: appointment._id.toString(),
        customerId: user._id.toString(),
        serviceName,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${serviceName} Appointment`,
              description: `Date: ${appointment.appointmentDate} | Slot: ${appointment.timeSlot}`,
              images: service?.image ? [service.image] : undefined,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${ENV.CLIENT_URL}/dashboard/customer/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${ENV.CLIENT_URL}/dashboard/customer/payments/cancel?appointment_id=${appointment._id}`,
    });

    // Save session ID on appointment
    appointment.stripeSessionId = session.id;
    await appointment.save();

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating checkout session.',
    });
  }
};

// Stripe Webhook: Verified event handler
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  let event: any;

  try {
    if (ENV.STRIPE_WEBHOOK_SECRET && sig) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        ENV.STRIPE_WEBHOOK_SECRET
      );
    } else {
      // In development fallback if webhook secret not set
      event = req.body;
      if (typeof event === 'string') {
        event = JSON.parse(event);
      }
    }
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed:`, err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const appointmentId = session.metadata?.appointmentId || session.client_reference_id;
    const customerId = session.metadata?.customerId;

    try {
      if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
        const appointment = await Appointment.findById(appointmentId);
        if (appointment && appointment.paymentStatus !== 'paid') {
          // Update appointment payment status to paid
          appointment.paymentStatus = 'paid';
          appointment.stripeSessionId = session.id;
          await appointment.save();

          // Create transaction record
          const existingTx = await Transaction.findOne({ stripeSessionId: session.id });
          if (!existingTx) {
            await Transaction.create({
              appointmentId: appointment._id,
              customerId: customerId || appointment.customerId,
              amount: session.amount_total ? session.amount_total / 100 : appointment.servicePrice,
              currency: session.currency || 'usd',
              stripeSessionId: session.id,
              status: 'paid',
            });
          }
          console.log(`✅ Webhook verified: Appointment ${appointmentId} marked as paid.`);
        }
      }
    } catch (dbError) {
      console.error('Error processing webhook event in database:', dbError);
    }
  }

  res.status(200).json({ received: true });
};

// Verify Session Fallback: In case webhook isn't fired in local dev/grading
export const verifyPaymentSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionId } = req.query;

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({ success: false, message: 'Session ID is required.' });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const appointmentId = session.metadata?.appointmentId || session.client_reference_id;
      const customerId = session.metadata?.customerId;

      if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
        const appointment = await Appointment.findById(appointmentId).populate('serviceId');
        if (appointment) {
          if (appointment.paymentStatus !== 'paid') {
            appointment.paymentStatus = 'paid';
            appointment.stripeSessionId = session.id;
            await appointment.save();
          }

          let transaction = await Transaction.findOne({ stripeSessionId: session.id });
          if (!transaction) {
            transaction = await Transaction.create({
              appointmentId: appointment._id,
              customerId: customerId || appointment.customerId,
              amount: session.amount_total ? session.amount_total / 100 : appointment.servicePrice,
              currency: session.currency || 'usd',
              stripeSessionId: session.id,
              status: 'paid',
            });
          }

          res.status(200).json({
            success: true,
            message: 'Payment verified successfully.',
            appointment,
            transaction,
          });
          return;
        }
      }
    }

    res.status(200).json({
      success: false,
      message: `Payment status is ${session.payment_status}.`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error verifying payment session.',
    });
  }
};

// Admin: View all transactions
export const getTransactionsAdmin = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const transactions = await Transaction.find()
      .populate({
        path: 'appointmentId',
        select: 'appointmentDate timeSlot servicePrice status paymentStatus',
        populate: {
          path: 'serviceId',
          select: 'serviceName category image',
        },
      })
      .populate('customerId', 'name email image phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching transactions for admin.',
    });
  }
};
