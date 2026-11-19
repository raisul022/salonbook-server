import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    ENV.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, image, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
      });
      return;
    }

    // Password validation rules (Page 10: min 6 chars, 1 uppercase, 1 lowercase)
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (!/[A-Z]/.test(password)) {
      res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter.',
      });
      return;
    }

    if (!/[a-z]/.test(password)) {
      res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter.',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Enforce role = 'customer' (Admin accounts must NOT be created through public registration)
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      image: image || '',
      phone: phone || '',
      role: 'customer',
      isBlocked: false,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        image: newUser.image,
        role: newUser.role,
        phone: newUser.phone,
        isBlocked: newUser.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    // Include password explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({
        success: false,
        message: 'Your account is blocked. Please contact support.',
      });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'Please sign in with Google or reset your password.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        phone: user.phone,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during sign in.',
    });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, image } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required from Google authentication.',
      });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (user.isBlocked) {
        res.status(403).json({
          success: false,
          message: 'Your account is blocked. Please contact support.',
        });
        return;
      }
      // Update image or name if provided and not set
      if (image && !user.image) user.image = image;
      await user.save();
    } else {
      // Create new customer
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        image: image || '',
        role: 'customer',
        isBlocked: false,
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        phone: user.phone,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during Google authentication.',
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        image: req.user.image,
        role: req.user.role,
        phone: req.user.phone,
        isBlocked: req.user.isBlocked,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching user profile.',
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { name, image, phone } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    if (name) user.name = name.trim();
    if (image !== undefined) user.image = image;
    if (phone !== undefined) user.phone = phone.trim();

    // Explicit security check: Prevent modifying role or isBlocked status
    // These properties are NOT accepted from req.body

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        phone: user.phone,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile.',
    });
  }
};
