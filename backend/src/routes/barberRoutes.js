import { Router } from 'express';
import { body } from 'express-validator';
import { listBarbers, createBarber, updateBarber, deleteBarber } from '../controllers/barberController.js';

const router = Router();

const barberValidators = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required')
];

router.get('/', listBarbers);
router.post('/', barberValidators, createBarber);
router.put('/:id', barberValidators, updateBarber);
router.delete('/:id', deleteBarber);

export default router;
