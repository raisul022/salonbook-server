import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Service } from '../models/Service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Public: Get all active services with Search, Category Filter, and Price Sort
export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, category, sort, limit } = req.query;

    const query: any = { status: 'active' };

    // Search by service name (Challenge Requirement 1)
    if (search && typeof search === 'string' && search.trim() !== '') {
      query.serviceName = { $regex: search.trim(), $options: 'i' };
    }

    // Category filter
    if (category && typeof category === 'string' && category.trim() !== '' && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Sorting (Challenge Requirement 3: Sort by service price)
    let sortOption: any = { createdAt: -1 }; // default: newest
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'duration-asc') {
      sortOption = { duration: 1 };
    } else if (sort === 'popular') {
      sortOption = { reviewsCount: -1 };
    }

    let serviceQuery = Service.find(query).sort(sortOption);

    if (limit && !isNaN(Number(limit))) {
      serviceQuery = serviceQuery.limit(Number(limit));
    }

    const services = await serviceQuery.exec();

    // Get categories list with counts
    const categoriesWithCount = await Service.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      count: services.length,
      categories: categoriesWithCount.map((c) => ({ name: c._id, count: c.count })),
      data: services,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching services.',
    });
  }
};

// Public: Get Single Service by ID (For Service Details page)
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
      return;
    }

    const service = await Service.findById(id);

    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found. It may have been removed.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching service details.',
    });
  }
};

// Admin: Get all services (active and inactive)
export const getAllServicesAdmin = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });

    const totalActive = services.filter((s) => s.status === 'active').length;
    const totalInactive = services.filter((s) => s.status === 'inactive').length;

    res.status(200).json({
      success: true,
      totalCount: services.length,
      activeCount: totalActive,
      inactiveCount: totalInactive,
      data: services,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching all services for admin.',
    });
  }
};

// Admin: Create new service
export const createService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { serviceName, category, description, price, duration, image, status } = req.body;

    if (!serviceName || !category || !description || price === undefined || duration === undefined || !image) {
      res.status(400).json({
        success: false,
        message: 'Please provide all required service fields (name, category, description, price, duration, image).',
      });
      return;
    }

    const numPrice = Number(price);
    const numDuration = Number(duration);

    if (isNaN(numPrice) || numPrice <= 0) {
      res.status(400).json({
        success: false,
        message: 'Price must be a positive number.',
      });
      return;
    }

    if (isNaN(numDuration) || numDuration <= 0) {
      res.status(400).json({
        success: false,
        message: 'Duration must be a positive number in minutes.',
      });
      return;
    }

    const newService = await Service.create({
      serviceName: serviceName.trim(),
      category: category.trim(),
      description: description.trim(),
      price: numPrice,
      duration: numDuration,
      image,
      status: status === 'inactive' ? 'inactive' : 'active',
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: newService,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating service.',
    });
  }
};

// Admin: Update service
export const updateService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
      return;
    }

    const { serviceName, category, description, price, duration, image, status } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
      return;
    }

    if (serviceName) service.serviceName = serviceName.trim();
    if (category) service.category = category.trim();
    if (description) service.description = description.trim();
    if (image) service.image = image;
    if (status && ['active', 'inactive'].includes(status)) service.status = status;

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        res.status(400).json({ success: false, message: 'Price must be a positive number.' });
        return;
      }
      service.price = numPrice;
    }

    if (duration !== undefined) {
      const numDuration = Number(duration);
      if (isNaN(numDuration) || numDuration <= 0) {
        res.status(400).json({ success: false, message: 'Duration must be a positive number.' });
        return;
      }
      service.duration = numDuration;
    }

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully.',
      data: service,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating service.',
    });
  }
};

// Admin: Delete service
export const deleteService = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
      return;
    }

    const service = await Service.findByIdAndDelete(id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting service.',
    });
  }
};

// Admin: Activate or Deactivate Service
export const toggleServiceStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid service ID format.',
      });
      return;
    }

    const service = await Service.findById(id);
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
      return;
    }

    service.status = service.status === 'active' ? 'inactive' : 'active';
    await service.save();

    res.status(200).json({
      success: true,
      message: `Service status updated to ${service.status}.`,
      data: service,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error toggling service status.',
    });
  }
};
