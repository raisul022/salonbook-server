import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ITransaction extends Document {
  appointmentId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: 'paid' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
    },
    currency: {
      type: String,
      default: 'usd',
      uppercase: true,
    },
    stripeSessionId: {
      type: String,
      required: [true, 'Stripe Checkout Session ID is required'],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['paid', 'failed'],
      default: 'paid',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', transactionSchema);
