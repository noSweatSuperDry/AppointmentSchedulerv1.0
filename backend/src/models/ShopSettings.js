import mongoose from 'mongoose';

const shopSettingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String
    },
    openingTime: {
      type: String,
      required: true
    },
    closingTime: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const ShopSettings = mongoose.model('ShopSettings', shopSettingsSchema);
