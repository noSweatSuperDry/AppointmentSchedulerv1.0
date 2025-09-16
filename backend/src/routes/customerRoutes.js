import { Router } from 'express';
import { body } from 'express-validator';
import { listCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';

const router = Router();

const customerValidators = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('phone').optional().isLength({ min: 7 }).withMessage('Phone number too short')
];

router.get('/', listCustomers);
router.post('/', customerValidators, createCustomer);
router.put('/:id', customerValidators, updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
