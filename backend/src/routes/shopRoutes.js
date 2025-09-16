import { Router } from 'express';
import { body } from 'express-validator';
import { getShopSettings, upsertShopSettings } from '../controllers/shopController.js';

const router = Router();

const shopValidators = [
  body('name').notEmpty(),
  body('location').notEmpty(),
  body('email').isEmail(),
  body('openingTime').matches(/^\d{2}:\d{2}$/).withMessage('Opening time must be HH:MM'),
  body('closingTime').matches(/^\d{2}:\d{2}$/).withMessage('Closing time must be HH:MM')
];

router.get('/', getShopSettings);
router.put('/', shopValidators, upsertShopSettings);

export default router;
