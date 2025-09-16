import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
import { createAppointment, fetchBarbers, fetchServices, fetchShopSettings } from '../utils/api.js';

const normalizeTime = (value) => {
  if (!value) return value;
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  return value.slice(0, 5);
};

const timeOptions = (open, close) => {
  if (!open || !close) {
    return [];
  }
  const start = dayjs(normalizeTime(open), 'HH:mm');
  const end = dayjs(normalizeTime(close), 'HH:mm');
  const slots = [];

  let cursor = start;
  while (cursor.add(30, 'minute').isBefore(end.add(1, 'minute'))) {
    slots.push(cursor.format('HH:mm'));
    cursor = cursor.add(30, 'minute');
  }
  return slots;
};

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [shop, setShop] = useState(null);
  const [status, setStatus] = useState({ type: null, message: '' });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      service: '',
      barber: '',
      date: dayjs().format('YYYY-MM-DD'),
      time: '',
      customerName: '',
      customerEmail: '',
      customerPhone: ''
    }
  });

  const selectedService = watch('service');
  const selectedBarber = watch('barber');
  const serviceDetail = useMemo(
    () => services.find((service) => service._id === selectedService) || null,
    [services, selectedService]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [serviceData, barberData, shopData] = await Promise.all([
          fetchServices(),
          fetchBarbers(),
          fetchShopSettings()
        ]);
        setServices(serviceData);
        setBarbers(barberData);
        setShop(shopData);
      } catch (error) {
        console.error(error);
        setStatus({ type: 'error', message: 'Failed to load booking data.' });
      }
    };

    load();
  }, []);

  const availableBarbers = useMemo(() => {
    if (!selectedService) return barbers;
    return barbers.filter((barber) =>
      barber.services.length === 0 || barber.services.some((service) => service._id === selectedService)
    );
  }, [barbers, selectedService]);

  const usingDefaultHours = !shop?.openingTime || !shop?.closingTime;
  const openingTime = normalizeTime(shop?.openingTime) || '09:00';
  const closingTime = normalizeTime(shop?.closingTime) || '18:00';

  const slotOptions = useMemo(() => {
    const baseSlots = timeOptions(openingTime, closingTime);
    if (!serviceDetail) return baseSlots;

    const closing = dayjs(closingTime, 'HH:mm');
    return baseSlots.filter((slot) => {
      const start = dayjs(slot, 'HH:mm');
      const end = start.add(Number(serviceDetail.durationMinutes || 0), 'minute');
      return end.isSame(closing) || end.isBefore(closing);
    });
  }, [openingTime, closingTime, serviceDetail]);

  const onSubmit = async (values) => {
    setStatus({ type: null, message: '' });
    try {
      const start = dayjs(`${values.date} ${values.time}`, 'YYYY-MM-DD HH:mm').toISOString();
      const payload = {
        service: values.service,
        barber: values.barber,
        startTime: start,
        customerName: values.customerName,
        customerEmail: values.customerEmail || undefined,
        customerPhone: values.customerPhone || undefined
      };

      await createAppointment(payload);
      setStatus({ type: 'success', message: 'Appointment booked! Check your email for confirmation.' });
      reset({
        service: '',
        barber: '',
        date: values.date,
        time: '',
        customerName: '',
        customerEmail: '',
        customerPhone: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to book appointment. Try another slot.';
      setStatus({ type: 'error', message });
    }
  };

  return (
    <div className="grid" style={{ gap: '2rem' }}>
      <section className="card">
        <div className="section-title">
          <h2>Book your visit</h2>
          {shop?.openingTime && shop?.closingTime ? (
            <span className="badge">Open {normalizeTime(shop.openingTime)} - {normalizeTime(shop.closingTime)}</span>
          ) : (
            <span className="badge">Default hours 09:00 - 18:00</span>
          )}
        </div>
        <p style={{ marginTop: 0, color: '#64748b' }}>
          Select a service and preferred barber, then choose a time that works for you.
        </p>

        {status.type ? (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              backgroundColor: status.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.2)',
              color: status.type === 'success' ? '#047857' : '#b91c1c'
            }}
          >
            {status.message}
          </div>
        ) : null}

        <form className="grid" style={{ gap: '1.25rem' }} onSubmit={handleSubmit(onSubmit)}>
          <div className="grid" style={{ gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label htmlFor="service">Service</label>
              <select id="service" {...register('service', { required: 'Choose a service' })}>
                <option value="">Select service</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>
                    {service.name} ({service.durationMinutes} min)
                  </option>
                ))}
              </select>
              {errors.service && <small style={{ color: '#b91c1c' }}>{errors.service.message}</small>}
            </div>

            <div>
              <label htmlFor="barber">Barber</label>
              <select id="barber" {...register('barber', { required: 'Choose a barber' })}>
                <option value="">Select barber</option>
                {availableBarbers.map((barber) => (
                  <option key={barber._id} value={barber._id}>
                    {barber.name}
                  </option>
                ))}
              </select>
              {errors.barber && <small style={{ color: '#b91c1c' }}>{errors.barber.message}</small>}
            </div>

            <div>
              <label htmlFor="date">Date</label>
              <input type="date" id="date" min={dayjs().format('YYYY-MM-DD')} {...register('date', { required: true })} />
            </div>

            <div>
              <label htmlFor="time">Time</label>
              <select id="time" {...register('time', { required: 'Pick a time slot' })}>
                <option value="">Select time</option>
                {slotOptions.map((slot) => (
                  <option key={slot} value={slot}>
                    {dayjs(slot, 'HH:mm').format('h:mm A')}
                  </option>
                ))}
              </select>
              {errors.time && <small style={{ color: '#b91c1c' }}>{errors.time.message}</small>}
              {slotOptions.length === 0 ? (
                <small style={{ color: '#64748b' }}>
                  {usingDefaultHours
                    ? 'Add services and barbers to enable booking slots.'
                    : 'No available slots. Adjust opening hours or service duration.'}
                </small>
              ) : null}
            </div>
          </div>

          <div className="grid" style={{ gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div>
              <label htmlFor="customerName">Your name</label>
              <input id="customerName" placeholder="John Fade" {...register('customerName', { required: 'Name is required' })} />
              {errors.customerName && <small style={{ color: '#b91c1c' }}>{errors.customerName.message}</small>}
            </div>
            <div>
              <label htmlFor="customerEmail">Email</label>
              <input
                id="customerEmail"
                type="email"
                placeholder="you@example.com"
                {...register('customerEmail', {
                  pattern: {
                    value: /.+@.+/,
                    message: 'Enter a valid email'
                  }
                })}
              />
            </div>
            <div>
              <label htmlFor="customerPhone">Phone</label>
              <input id="customerPhone" placeholder="(555) 123-4567" {...register('customerPhone')} />
            </div>
          </div>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Booking...' : 'Confirm appointment'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="section-title">
          <h2>Our services</h2>
          <span className="tag">Pick your style</span>
        </div>
        <div className="grid" style={{ gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {services.map((service) => (
            <article key={service._id} className="card" style={{ boxShadow: 'none', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
              <h3 style={{ marginTop: 0 }}>{service.name}</h3>
              <p style={{ color: '#64748b', minHeight: '48px' }}>{service.description || 'Professional care for your look.'}</p>
              <p style={{ fontWeight: 700, marginBottom: 0 }}>${service.price?.toFixed?.(2) ?? '—'}</p>
              <small style={{ color: '#1d4ed8' }}>{service.durationMinutes} min session</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
