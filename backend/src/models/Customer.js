import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    preferredBarber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barber'
    },
    preferredServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ]
  },
  { timestamps: true }
);

export const Customer = mongoose.model('Customer', customerSchema);
