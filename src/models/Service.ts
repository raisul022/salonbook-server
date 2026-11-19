import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IService extends Document {
  serviceName: string;
  category: string;
  description: string;
  price: number;
  duration: number; // in minutes
  image: string;
  status: 'active' | 'inactive';
  rating?: number; // Extra feature: average customer rating
  reviewsCount?: number; // Extra feature: review count
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [1, 'Price must be a positive number'],
    },
    duration: {
      type: Number,
      required: [true, 'Service duration (in minutes) is required'],
      min: [1, 'Duration must be a positive number'],
    },
    image: {
      type: String,
      required: [true, 'Service image is required'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 12,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>('Service', serviceSchema);
