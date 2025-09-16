import { Router } from 'express';
import { body } from 'express-validator';
import { listAppointments, createAppointment, updateAppointmentStatus } from '../controllers/appointmentController.js';

const router = Router();

const appointmentValidators = [
  body('service').notEmpty().withMessage('Service is required'),
  body('barber').notEmpty().withMessage('Barber is required'),
  body('startTime').isISO8601().withMessage('Start time must be a valid date'),
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerEmail').optional().isEmail().withMessage('Invalid email'),
  body('customerPhone').optional().isLength({ min: 7 }).withMessage('Invalid phone number')
];

router.get('/', listAppointments);
router.post('/', appointmentValidators, createAppointment);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
