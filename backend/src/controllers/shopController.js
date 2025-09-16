import { validationResult } from 'express-validator';
import { ShopSettings } from '../models/ShopSettings.js';

export const getShopSettings = async (_req, res, next) => {
  try {
    const settings = await ShopSettings.findOne().sort({ updatedAt: -1 });
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

export const upsertShopSettings = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updated = await ShopSettings.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
      runValidators: true
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
