import { Router } from 'express';
import { body } from 'express-validator';
import { listServices, createService, updateService, deleteService } from '../controllers/serviceController.js';

const router = Router();

const serviceValidators = [
  body('name').notEmpty().withMessage('Name is required'),
  body('durationMinutes').isInt({ min: 5 }).withMessage('Duration must be at least 5 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be zero or greater')
];

router.get('/', listServices);
router.post('/', serviceValidators, createService);
router.put('/:id', serviceValidators, updateService);
router.delete('/:id', deleteService);

export default router;
