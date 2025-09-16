import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const fetchServices = () => api.get('/services').then((res) => res.data);
export const fetchBarbers = () => api.get('/barbers').then((res) => res.data);
export const fetchShopSettings = () => api.get('/shop').then((res) => res.data);
export const fetchCustomers = () => api.get('/customers').then((res) => res.data);
export const fetchAppointments = () => api.get('/appointments').then((res) => res.data);
export const createAppointment = (payload) => api.post('/appointments', payload).then((res) => res.data);
export const createService = (payload) => api.post('/services', payload).then((res) => res.data);
export const createBarber = (payload) => api.post('/barbers', payload).then((res) => res.data);
export const upsertShopSettings = (payload) => api.put('/shop', payload).then((res) => res.data);
export const createCustomer = (payload) => api.post('/customers', payload).then((res) => res.data);
export const updateAppointmentStatus = (id, status) => api.patch(`/appointments/${id}/status`, { status }).then((res) => res.data);
