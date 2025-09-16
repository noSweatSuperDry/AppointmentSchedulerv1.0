import { validationResult } from 'express-validator';
import { getShopSettings as fetchShopSettings, saveShopSettings } from '../data/index.js';

export const getShopSettings = async (_req, res, next) => {
  try {
    const settings = await fetchShopSettings();
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
    const updated = await saveShopSettings(req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
