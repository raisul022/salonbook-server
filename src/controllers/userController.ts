import { Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Admin: View all registered customers
export const getAllCustomersAdmin = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customer list.',
    });
  }
};

// Admin: View user details with their appointment history
export const getUserDetailsAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID format.' });
      return;
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const appointments = await Appointment.find({ customerId: user._id })
      .populate('serviceId', 'serviceName category price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        user,
        appointmentCount: appointments.length,
        appointments,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user details.',
    });
  }
};

// Admin: Block or unblock a user
export const toggleBlockUserAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const currentAdmin = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID format.' });
      return;
    }

    // Safety: Admin cannot block themselves
    if (currentAdmin && currentAdmin._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot block your own administrative account.',
      });
      return;
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Toggle block status
    targetUser.isBlocked = !targetUser.isBlocked;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User ${targetUser.name} has been ${targetUser.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
      data: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        isBlocked: targetUser.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling user block status.',
    });
  }
};
