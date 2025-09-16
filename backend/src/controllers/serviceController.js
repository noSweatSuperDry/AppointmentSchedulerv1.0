import { validationResult } from 'express-validator';
import { createService as createServiceRecord, listServices as fetchServices, updateService as updateServiceRecord, softDeleteService } from '../data/index.js';

export const listServices = async (req, res, next) => {
  try {
    const services = await fetchServices();
    const active = services.filter((service) => service.isActive !== false);
    active.sort((a, b) => a.name.localeCompare(b.name));
    res.json(active);
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const service = await createServiceRecord({
      ...req.body,
      isActive: true
    });
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const service = await updateServiceRecord(req.params.id, req.body);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const service = await softDeleteService(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
};
