import { validationResult } from 'express-validator';
import {
  listCustomers as fetchCustomers,
  createCustomer as createCustomerRecord,
  updateCustomer as updateCustomerRecord,
  deleteCustomer as deleteCustomerRecord,
  listServices,
  listBarbers as fetchBarbers
} from '../data/index.js';

export const listCustomers = async (_req, res, next) => {
  try {
    const [customers, services, barbers] = await Promise.all([
      fetchCustomers(),
      listServices(),
      fetchBarbers()
    ]);

    const serviceMap = new Map(services.map((service) => [service._id, service]));
    const barberMap = new Map(barbers.map((barber) => [barber._id, barber]));

    const enriched = customers.map((customer) => ({
      ...customer,
      preferredBarber: customer.preferredBarber ? barberMap.get(customer.preferredBarber) || null : null,
      preferredServices: (customer.preferredServices || [])
        .map((serviceId) => serviceMap.get(serviceId))
        .filter(Boolean)
    }));
    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const customer = await createCustomerRecord(req.body);
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const customer = await updateCustomerRecord(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await deleteCustomerRecord(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer removed' });
  } catch (error) {
    next(error);
  }
};
