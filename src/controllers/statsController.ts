import { Response } from 'express';
import { User } from '../models/User.js';
import { Service } from '../models/Service.js';
import { Appointment } from '../models/Appointment.js';
import { Transaction } from '../models/Transaction.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Customer: Get summary stats for dashboard overview
export const getCustomerStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const [total, pending, confirmed, cancelled, paidAppointments] = await Promise.all([
      Appointment.countDocuments({ customerId: user._id }),
      Appointment.countDocuments({ customerId: user._id, status: 'pending' }),
      Appointment.countDocuments({ customerId: user._id, status: 'confirmed' }),
      Appointment.countDocuments({ customerId: user._id, status: 'cancelled' }),
      Appointment.countDocuments({ customerId: user._id, paymentStatus: 'paid' }),
    ]);

    // Extra: Recent 5 appointments for quick glance
    const recentAppointments = await Appointment.find({ customerId: user._id })
      .populate('serviceId', 'serviceName category image duration price')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalAppointments: total,
        pendingAppointments: pending,
        confirmedAppointments: confirmed,
        cancelledAppointments: cancelled,
        paidAppointments,
      },
      recentAppointments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customer statistics.',
    });
  }
};

// Admin: Get summary metrics for admin dashboard overview
export const getAdminStats = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const [
      totalCustomers,
      totalActiveServices,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      cancelledAppointments,
      successfulPaymentsCount,
      transactions,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Service.countDocuments({ status: 'active' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Transaction.countDocuments({ status: 'paid' }),
      Transaction.find({ status: 'paid' }),
    ]);

    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Recent 5 appointments for activity feed
    const recentAppointments = await Appointment.find()
      .populate('serviceId', 'serviceName category image price')
      .populate('customerId', 'name email image')
      .sort({ createdAt: -1 })
      .limit(5);

    // Extra: Monthly/Category revenue distribution for analytics charts
    const categoryStats = await Appointment.aggregate([
      { $match: { status: 'confirmed', paymentStatus: 'paid' } },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      {
        $group: {
          _id: '$service.category',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$servicePrice' },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalActiveServices,
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        cancelledAppointments,
        successfulPaymentsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
      categoryStats,
      recentAppointments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching admin statistics.',
    });
  }
};
