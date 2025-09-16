import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import {
  createCustomer,
  createService,
  createBarber,
  fetchAppointments,
  fetchBarbers,
  fetchCustomers,
  fetchServices,
  fetchShopSettings,
  updateAppointmentStatus,
  upsertShopSettings
} from '../utils/api.js';

const defaultShopValues = {
  name: '',
  location: '',
  email: '',
  phone: '',
  openingTime: '09:00',
  closingTime: '18:00'
};

const statusPills = {
  scheduled: 'status-scheduled',
  completed: 'status-completed',
  cancelled: 'status-cancelled'
};

export default function AdminDashboard() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const shopForm = useForm({ defaultValues: defaultShopValues });
  const customerForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      preferredBarber: '',
      preferredServices: []
    }
  });
  const serviceForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      durationMinutes: 30,
      price: ''
    }
  });
  const barberForm = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      services: []
    }
  });

  const loadData = useCallback(async () => {
    try {
      const [serviceData, barberData, customerData, appointmentData, shopData] = await Promise.all([
        fetchServices(),
        fetchBarbers(),
        fetchCustomers(),
        fetchAppointments(),
        fetchShopSettings()
      ]);
      setServices(serviceData);
      setBarbers(barberData);
      setCustomers(customerData);
      setAppointments(appointmentData);
      if (shopData) {
        shopForm.reset({ ...defaultShopValues, ...shopData });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Failed to load admin data.' });
    }
  }, [shopForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((appt) => dayjs(appt.startTime).isAfter(dayjs().subtract(1, 'day'))),
    [appointments]
  );

  const summary = useMemo(() => (
    {
      totalCustomers: customers.length,
      activeServices: services.length,
      activeBarbers: barbers.length,
      upcoming: upcomingAppointments.length
    }
  ), [customers.length, services.length, barbers.length, upcomingAppointments.length]);

  const submitShop = shopForm.handleSubmit(async (values) => {
    try {
      await upsertShopSettings(values);
      setFeedback({ type: 'success', message: 'Shop details updated.' });
    } catch (error) {
      const message = error.response?.data?.message || 'Could not update shop settings';
      setFeedback({ type: 'error', message });
    }
  });

  const submitService = serviceForm.handleSubmit(async (values) => {
    try {
      await createService({
        name: values.name,
        description: values.description,
        durationMinutes: Number(values.durationMinutes),
        price: Number(values.price)
      });
      setFeedback({ type: 'success', message: 'Service added.' });
      serviceForm.reset({ name: '', description: '', durationMinutes: 30, price: '' });
      const refreshed = await fetchServices();
      setServices(refreshed);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add service';
      setFeedback({ type: 'error', message });
    }
  });

  const submitBarber = barberForm.handleSubmit(async (values) => {
    try {
      const serviceIds = Array.isArray(values.services)
        ? values.services
        : values.services
        ? [values.services]
        : [];
      await createBarber({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        services: serviceIds
      });
      setFeedback({ type: 'success', message: 'Barber added.' });
      barberForm.reset({ name: '', email: '', phone: '', services: [] });
      const refreshed = await fetchBarbers();
      setBarbers(refreshed);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add barber';
      setFeedback({ type: 'error', message });
    }
  });

  const submitCustomer = customerForm.handleSubmit(async (payload) => {
    try {
      await createCustomer(payload);
      setFeedback({ type: 'success', message: 'Customer profile added.' });
      customerForm.reset({
        name: '',
        email: '',
        phone: '',
        preferredBarber: '',
        preferredServices: []
      });
      const refreshed = await fetchCustomers();
      setCustomers(refreshed);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add customer';
      setFeedback({ type: 'error', message });
    }
  });

  const mutateAppointment = async (id, status) => {
    try {
      await updateAppointmentStatus(id, status);
      const refreshed = await fetchAppointments();
      setAppointments(refreshed);
      setFeedback({ type: 'success', message: `Appointment ${status}.` });
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to update appointment status';
      setFeedback({ type: 'error', message });
    }
  };

  return (
    <div className="grid" style={{ gap: '2rem' }}>
      {feedback ? (
        <div
          className="card"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: feedback.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.18)',
            color: feedback.type === 'success' ? '#065f46' : '#b91c1c'
          }}
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="card">
        <h2>Overview</h2>
        <div className="grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <SummaryCard label="Customers" value={summary.totalCustomers} />
          <SummaryCard label="Services" value={summary.activeServices} />
          <SummaryCard label="Barbers" value={summary.activeBarbers} />
          <SummaryCard label="Upcoming" value={summary.upcoming} />
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Shop configuration</h2>
          <span className="tag">Business info</span>
        </div>
        <form className="grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }} onSubmit={submitShop}>
          <div>
            <label htmlFor="shop-name">Shop name</label>
            <input id="shop-name" {...shopForm.register('name', { required: true })} />
          </div>
          <div>
            <label htmlFor="shop-location">Location</label>
            <input id="shop-location" {...shopForm.register('location', { required: true })} />
          </div>
          <div>
            <label htmlFor="shop-email">Email</label>
            <input type="email" id="shop-email" {...shopForm.register('email', { required: true })} />
          </div>
          <div>
            <label htmlFor="shop-phone">Phone</label>
            <input id="shop-phone" {...shopForm.register('phone')} />
          </div>
          <div>
            <label htmlFor="shop-open">Opening time</label>
            <input type="time" id="shop-open" {...shopForm.register('openingTime', { required: true })} />
          </div>
          <div>
            <label htmlFor="shop-close">Closing time</label>
            <input type="time" id="shop-close" {...shopForm.register('closingTime', { required: true })} />
          </div>
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button className="primary-button" type="submit" disabled={shopForm.formState.isSubmitting}>
              {shopForm.formState.isSubmitting ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Services</h2>
          <span className="tag">Manage offerings</span>
        </div>
        <form className="grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }} onSubmit={submitService}>
          <div>
            <label htmlFor="service-name">Service name</label>
            <input id="service-name" {...serviceForm.register('name', { required: true })} />
          </div>
          <div>
            <label htmlFor="service-price">Price ($)</label>
            <input type="number" step="0.01" id="service-price" {...serviceForm.register('price', { required: true })} />
          </div>
          <div>
            <label htmlFor="service-duration">Duration (minutes)</label>
            <input type="number" id="service-duration" {...serviceForm.register('durationMinutes', { required: true, min: 5 })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="service-description">Description</label>
            <textarea id="service-description" rows={2} {...serviceForm.register('description')} />
          </div>
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button className="primary-button" type="submit" disabled={serviceForm.formState.isSubmitting}>
              {serviceForm.formState.isSubmitting ? 'Saving...' : 'Add service'}
            </button>
          </div>
        </form>
        <div className="grid" style={{ marginTop: '1.5rem', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {services.map((service) => (
            <div key={service._id} className="card" style={{ boxShadow: 'none', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
              <h3 style={{ marginTop: 0 }}>{service.name}</h3>
              <p style={{ margin: '0.25rem 0', color: '#1d4ed8', fontWeight: 600 }}>${Number(service.price || 0).toFixed(2)}</p>
              <p style={{ margin: 0, color: '#64748b' }}>{service.durationMinutes} min</p>
              <p style={{ marginTop: '0.75rem', color: '#475569' }}>{service.description || '—'}</p>
            </div>
          ))}
          {services.length === 0 ? (
            <div style={{ color: '#64748b' }}>No services yet. Add your first service above.</div>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Barbers</h2>
          <span className="tag">Team</span>
        </div>
        <form className="grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }} onSubmit={submitBarber}>
          <div>
            <label htmlFor="barber-name">Full name</label>
            <input id="barber-name" {...barberForm.register('name', { required: true })} />
          </div>
          <div>
            <label htmlFor="barber-email">Email</label>
            <input type="email" id="barber-email" {...barberForm.register('email', { required: true })} />
          </div>
          <div>
            <label htmlFor="barber-phone">Phone</label>
            <input id="barber-phone" {...barberForm.register('phone')} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="barber-services">Services offered</label>
            <select id="barber-services" multiple {...barberForm.register('services')}>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#64748b' }}>Hold CTRL/Cmd to choose multiple services</small>
          </div>
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button className="primary-button" type="submit" disabled={barberForm.formState.isSubmitting}>
              {barberForm.formState.isSubmitting ? 'Saving...' : 'Add barber'}
            </button>
          </div>
        </form>
        <div className="grid" style={{ marginTop: '1.5rem', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {barbers.map((barber) => (
            <div key={barber._id} className="card" style={{ boxShadow: 'none', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
              <h3 style={{ marginTop: 0 }}>{barber.name}</h3>
              <p style={{ margin: '0.25rem 0', color: '#475569' }}>{barber.email}</p>
              {barber.phone ? <p style={{ margin: 0, color: '#64748b' }}>{barber.phone}</p> : null}
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(barber.services || []).map((service) => (
                  <span key={service._id || service} className="badge" style={{ fontSize: '0.75rem' }}>
                    {service.name || service}
                  </span>
                ))}
                {(barber.services || []).length === 0 ? (
                  <span style={{ color: '#94a3b8' }}>No services linked</span>
                ) : null}
              </div>
            </div>
          ))}
          {barbers.length === 0 ? (
            <div style={{ color: '#64748b' }}>No barbers yet. Add team members above.</div>
          ) : null}
        </div>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Add customer</h2>
          <span className="tag">Build loyalty</span>
        </div>
        <form className="grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }} onSubmit={submitCustomer}>
          <div>
            <label htmlFor="customer-name">Full name</label>
            <input id="customer-name" {...customerForm.register('name', { required: true })} />
          </div>
          <div>
            <label htmlFor="customer-email">Email</label>
            <input type="email" id="customer-email" {...customerForm.register('email')} />
          </div>
          <div>
            <label htmlFor="customer-phone">Phone</label>
            <input id="customer-phone" {...customerForm.register('phone')} />
          </div>
          <div>
            <label htmlFor="customer-barber">Preferred barber</label>
            <select id="customer-barber" {...customerForm.register('preferredBarber')}>
              <option value="">No preference</option>
              {barbers.map((barber) => (
                <option key={barber._id} value={barber._id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="customer-services">Preferred services</label>
            <select id="customer-services" multiple {...customerForm.register('preferredServices')}>
              {services.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name}
                </option>
              ))}
            </select>
            <small style={{ color: '#64748b' }}>Hold CTRL/Cmd to choose multiple</small>
          </div>
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button className="primary-button" type="submit" disabled={customerForm.formState.isSubmitting}>
              {customerForm.formState.isSubmitting ? 'Saving...' : 'Add customer'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Upcoming appointments</h2>
          <span className="tag">Operations</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Barber</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcomingAppointments.map((appt) => (
                <tr key={appt._id}>
                  <td>
                    <strong>{dayjs(appt.startTime).format('MMM D')}</strong>
                    <div style={{ color: '#64748b' }}>{dayjs(appt.startTime).format('h:mm A')}</div>
                  </td>
                  <td>
                    {appt.customerName}
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{appt.customerEmail || appt.customerPhone}</div>
                  </td>
                  <td>{appt.service?.name}</td>
                  <td>{appt.barber?.name}</td>
                  <td>
                    <span className={`badge ${statusPills[appt.status]}`}>{appt.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="primary-button" style={{ padding: '0.35rem 0.75rem' }} onClick={() => mutateAppointment(appt._id, 'completed')}>
                        Complete
                      </button>
                      <button
                        type="button"
                        className="primary-button"
                        style={{
                          padding: '0.35rem 0.75rem',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)'
                        }}
                        onClick={() => mutateAppointment(appt._id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {upcomingAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No appointments scheduled.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="card" style={{ boxShadow: 'none', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
      <p style={{ color: '#64748b', margin: 0 }}>{label}</p>
      <h3 style={{ margin: 0 }}>{value}</h3>
    </div>
  );
}
