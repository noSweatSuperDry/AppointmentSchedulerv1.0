import { validationResult } from 'express-validator';
import { Barber } from '../models/Barber.js';

export const listBarbers = async (req, res, next) => {
  try {
    const barbers = await Barber.find({ isActive: true }).populate('services').sort('name');
    res.json(barbers);
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
    const barber = await Barber.create(req.body);
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
    const barber = await Barber.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
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
    const barber = await Barber.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!barber) {
      return res.status(404).json({ message: 'Barber not found' });
    }
    res.json(barber);
  } catch (error) {
    next(error);
  }
};
