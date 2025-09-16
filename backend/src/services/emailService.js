import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SHOP_EMAIL } from '../config/env.js';

let transporter;

const ensureTransporter = () => {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP credentials missing; email sending disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  return transporter;
};

export const sendAppointmentEmails = async ({
  barberEmail,
  customerEmail,
  appointment,
  service,
  barber,
  shop
}) => {
  const activeTransporter = ensureTransporter();
  if (!activeTransporter) {
    return;
  }

  const baseDetails = `Service: ${service.name}\nBarber: ${barber.name}\nDate: ${appointment.startTime.toLocaleString()}\nDuration: ${service.durationMinutes} minutes`;

  const messages = [];

  if (customerEmail) {
    messages.push({
      to: customerEmail,
      subject: `Booking confirmed at ${shop.name}`,
      text: `Hi ${appointment.customerName},\n\nYour appointment is confirmed.\n\n${baseDetails}\nLocation: ${shop.location}\n\nSee you soon!\n${shop.name}`
    });
  }

  if (barberEmail) {
    messages.push({
      to: barberEmail,
      subject: `New appointment with ${appointment.customerName}`,
      text: `A new appointment was booked.\n\n${baseDetails}\nCustomer contact: ${appointment.customerEmail || appointment.customerPhone}`
    });
  }

  const fromAddress = shop.email || SHOP_EMAIL || SMTP_USER;

  await Promise.all(
    messages.map((message) =>
      activeTransporter.sendMail({
        from: fromAddress,
        ...message
      })
    )
  );
};
