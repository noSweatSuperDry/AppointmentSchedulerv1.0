import { Router } from 'express';
import serviceRoutes from './serviceRoutes.js';
import barberRoutes from './barberRoutes.js';
import customerRoutes from './customerRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import shopRoutes from './shopRoutes.js';

const router = Router();

router.use('/services', serviceRoutes);
router.use('/barbers', barberRoutes);
router.use('/customers', customerRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/shop', shopRoutes);

export default router;
