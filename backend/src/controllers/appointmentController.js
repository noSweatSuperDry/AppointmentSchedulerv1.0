import { validationResult } from 'express-validator';
import { Appointment } from '../models/Appointment.js';
import { Service } from '../models/Service.js';
import { Barber } from '../models/Barber.js';
import { Customer } from '../models/Customer.js';
import { ShopSettings } from '../models/ShopSettings.js';
import { sendAppointmentEmails } from '../services/emailService.js';

const defaultShopMeta = {
  name: 'Your Barber Shop',
  location: '123 Main Street',
  email: null
};

const resolveShopMeta = async () => {
  const settings = await ShopSettings.findOne().sort({ updatedAt: -1 });
  if (!settings) return defaultShopMeta;
  return {
    name: settings.name,
    location: settings.location,
    email: settings.email
  };
};

export const listAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate('service')
      .populate('barber')
      .populate('customer')
      .sort({ startTime: 1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { service: serviceId, barber: barberId, startTime, customerId, customerName, customerEmail, customerPhone } = req.body;

    const [service, barber] = await Promise.all([
      Service.findById(serviceId),
      Barber.findById(barberId)
    ]);

    if (!service || !barber) {
      return res.status(404).json({ message: 'Service or barber not found' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.durationMinutes * 60000);

    const appointmentData = {
      service: serviceId,
      barber: barberId,
      startTime: start,
      endTime: end,
      customerName,
      customerEmail,
      customerPhone
    };

    if (customerId) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        appointmentData.customer = customerId;
      }
    }

    const appointment = await Appointment.create(appointmentData);

    const shopMeta = await resolveShopMeta();

    await sendAppointmentEmails({
      barberEmail: barber.email,
      customerEmail,
      appointment,
      service,
      barber,
      shop: shopMeta
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Time slot already booked for this barber' });
    }
    next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  const { status } = req.body;
  if (!['scheduled', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};
