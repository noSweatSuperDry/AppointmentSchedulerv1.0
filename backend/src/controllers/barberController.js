import { validationResult } from 'express-validator';
import {
  listBarbers as fetchBarbers,
  createBarber as createBarberRecord,
  updateBarber as updateBarberRecord,
  softDeleteBarber,
  listServices
} from '../data/index.js';

export const listBarbers = async (_req, res, next) => {
  try {
    const [barbers, services] = await Promise.all([fetchBarbers(), listServices()]);
    const active = barbers.filter((barber) => barber.isActive !== false);
    active.sort((a, b) => a.name.localeCompare(b.name));
    const serviceMap = new Map(services.map((service) => [service._id, service]));
    const enriched = active.map((barber) => ({
      ...barber,
      services: (barber.services || [])
        .map((serviceId) => serviceMap.get(serviceId))
        .filter(Boolean)
    }));
    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const createBarber = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const barber = await createBarberRecord({
      ...req.body,
      isActive: true
    });
    res.status(201).json(barber);
  } catch (error) {
    next(error);
  }
};

export const updateBarber = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const barber = await updateBarberRecord(req.params.id, req.body);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }
    res.json(barber);
  } catch (error) {
    next(error);
  }
};

export const deleteBarber = async (req, res, next) => {
  try {
    const barber = await softDeleteBarber(req.params.id);
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }
    res.json(barber);
  } catch (error) {
    next(error);
  }
};
