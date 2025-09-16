import { validationResult } from 'express-validator';
import {
  listAppointments as fetchAppointments,
  createAppointmentRecord,
  updateAppointmentRecord,
  findServiceById,
  findBarberById,
  findCustomerById,
  getShopSettings
} from '../data/index.js';
import { sendAppointmentEmails } from '../services/emailService.js';

const defaultShopMeta = {
  name: 'Your Barber Shop',
  location: '123 Main Street',
  email: null,
  openingTime: null,
  closingTime: null
};

const resolveShopMeta = async () => {
  const settings = await getShopSettings();
  if (!settings) return defaultShopMeta;
  return {
    name: settings.name || defaultShopMeta.name,
    location: settings.location || defaultShopMeta.location,
    email: settings.email || defaultShopMeta.email,
    openingTime: settings.openingTime || defaultShopMeta.openingTime,
    closingTime: settings.closingTime || defaultShopMeta.closingTime
  };
};

const timeStringToMinutes = (value) => {
  if (!value || typeof value !== 'string') return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

const minutesSinceMidnight = (date) => date.getHours() * 60 + date.getMinutes();

const hydrateAppointment = async (appointment) => {
  const [service, barber, customer] = await Promise.all([
    findServiceById(appointment.service),
    findBarberById(appointment.barber),
    appointment.customer ? findCustomerById(appointment.customer) : Promise.resolve(null)
  ]);

  return {
    ...appointment,
    service,
    barber,
    customer
  };
};

const hasConflict = (appointments, barberId, start) => {
  return appointments.some((appt) => {
    if (appt.barber !== barberId) return false;
    if (appt.status === 'cancelled') return false;
    return new Date(appt.startTime).getTime() === start.getTime();
  });
};

export const listAppointments = async (_req, res, next) => {
  try {
    const appointments = [...(await fetchAppointments())];
    appointments.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const detailed = await Promise.all(appointments.map(hydrateAppointment));
    res.json(detailed);
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
      findServiceById(serviceId),
      findBarberById(barberId)
    ]);

    if (!service || service.isActive === false || !barber || barber.isActive === false) {
      return res.status(404).json({ message: 'Service or barber not found' });
    }

    const start = new Date(startTime);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: 'Invalid start time' });
    }
    const end = new Date(start.getTime() + Number(service.durationMinutes || 0) * 60000);

    const shopMeta = await resolveShopMeta();

    const appointments = await fetchAppointments();
    if (hasConflict(appointments, barberId, start)) {
      return res.status(409).json({ message: 'Time slot already booked for this barber' });
    }

    const openingMinutes = timeStringToMinutes(shopMeta.openingTime);
    const closingMinutes = timeStringToMinutes(shopMeta.closingTime);
    const startMinutes = minutesSinceMidnight(start);
    const endMinutes = minutesSinceMidnight(end);

    if (openingMinutes !== null) {
      if (startMinutes < openingMinutes) {
        return res.status(400).json({ message: 'Selected time is before opening hours' });
      }
      const diff = startMinutes - openingMinutes;
      if (diff % 30 !== 0) {
        return res.status(400).json({ message: 'Please choose a slot in 30 minute increments from opening time' });
      }
    }

    if (closingMinutes !== null && endMinutes > closingMinutes) {
      return res.status(400).json({ message: 'Appointment exceeds closing hours' });
    }

    const appointmentPayload = {
      service: serviceId,
      barber: barberId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      customerName,
      customerEmail,
      customerPhone,
      status: 'scheduled'
    };

    if (customerId) {
      const customer = await findCustomerById(customerId);
      if (customer) {
        appointmentPayload.customer = customer._id;
      }
    }

    const created = await createAppointmentRecord(appointmentPayload);
    await sendAppointmentEmails({
      barberEmail: barber.email,
      customerEmail,
      appointment: {
        ...created,
        startTime: start,
        endTime: end
      },
      service,
      barber,
      shop: shopMeta
    });

    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  const { status } = req.body;
  if (!['scheduled', 'cancelled', 'completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const appointment = await updateAppointmentRecord(req.params.id, { status });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};
