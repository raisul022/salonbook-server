import { Response } from 'express';
import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Customer: Submit an appointment request
export const createAppointment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Rule: Admins cannot submit customer appointment requests
    if (user.role === 'admin') {
      res.status(403).json({
        success: false,
        message: 'Administrators cannot book appointments. Please use a customer account.',
      });
      return;
    }

    const { serviceId, appointmentDate, timeSlot, message } = req.body;

    if (!serviceId || !appointmentDate || !timeSlot) {
      res.status(400).json({
        success: false,
        message: 'Please provide serviceId, appointmentDate, and timeSlot.',
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid service ID provided.',
      });
      return;
    }

    // Rule: Prevent customers from booking inactive services
    const service = await Service.findById(serviceId);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'The requested service was not found.',
      });
      return;
    }

    if (service.status !== 'active') {
      res.status(400).json({
        success: false,
        message: 'This service is currently inactive and cannot be booked.',
      });
      return;
    }

    // Rule: Prevent duplicate active appointments for the same date and time slot
    const existingConflict = await Appointment.findOne({
      serviceId,
      appointmentDate,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingConflict) {
      res.status(409).json({
        success: false,
        message: 'This time slot is already reserved for this service. Please choose another time or date.',
      });
      return;
    }

    const appointment = await Appointment.create({
      serviceId: service._id,
      customerId: user._id,
      appointmentDate,
      timeSlot,
      message: message ? message.trim() : '',
      servicePrice: service.price,
      paymentStatus: 'unpaid',
      status: 'pending',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('serviceId', 'serviceName category image duration price')
      .populate('customerId', 'name email image phone');

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully. Awaiting salon confirmation.',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating appointment request.',
    });
  }
};

// Customer: View their own appointments
export const getCustomerAppointments = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const appointments = await Appointment.find({ customerId: user._id })
      .populate('serviceId', 'serviceName category image duration price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching customer appointments.',
    });
  }
};

// Customer: Cancel pending appointment request
export const cancelAppointmentCustomer = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
      return;
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    // Rule: Customers can only view/cancel their own appointments
    if (appointment.customerId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this appointment.',
      });
      return;
    }

    // Rule: Customers cannot cancel an already confirmed or cancelled appointment
    if (appointment.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Cannot cancel an appointment that is already ${appointment.status}.`,
      });
      return;
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment request cancelled successfully.',
      data: appointment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling appointment.',
    });
  }
};

// Admin: View all appointments
export const getAllAppointmentsAdmin = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const appointments = await Appointment.find()
      .populate('serviceId', 'serviceName category image duration price status')
      .populate('customerId', 'name email image phone isBlocked')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointments for admin.',
    });
  }
};

// Admin: Confirm pending appointment
export const confirmAppointmentAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
      return;
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    // Rule: Only pending appointments can be confirmed
    if (appointment.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: `Only pending appointments can be confirmed. Current status: ${appointment.status}.`,
      });
      return;
    }

    appointment.status = 'confirmed';
    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('serviceId', 'serviceName category image duration price')
      .populate('customerId', 'name email image phone');

    res.status(200).json({
      success: true,
      message: 'Appointment confirmed successfully. Customer can now make payment.',
      data: populated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error confirming appointment.',
    });
  }
};

// Admin: Cancel pending or confirmed appointment
export const cancelAppointmentAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
      return;
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    if (appointment.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'This appointment is already cancelled.',
      });
      return;
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment has been cancelled by administrator.',
      data: appointment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling appointment.',
    });
  }
};

// Details: Single appointment details
export const getAppointmentDetails = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
      return;
    }

    const appointment = await Appointment.findById(id)
      .populate('serviceId')
      .populate('customerId', 'name email image phone');

    if (!appointment) {
      res.status(404).json({ success: false, message: 'Appointment not found.' });
      return;
    }

    // Role security: Only customer owner or admin can view
    if (user.role !== 'admin' && appointment.customerId._id.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to view this appointment.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointment details.',
    });
  }
};
