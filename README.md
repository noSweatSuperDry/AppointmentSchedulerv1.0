# AppointmentApp

Full-stack barber appointment scheduling platform built with the MERN stack. Customers can browse services, choose an available barber, pick a time slot, and receive automated confirmation emails. Administrators manage customers, services, barbers, and shop settings from a modern dashboard.

## Project structure

```
AppointmentApp/
├── backend/         # Express API, MongoDB models, email notifications
│   └── src/
│       ├── config/  # Environment + database setup
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       └── services/
├── frontend/        # React single-page app (Vite)
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── styles/
│       └── utils/
└── README.md
```

## Backend (Express + MongoDB)

### Features

- REST endpoints for services, barbers, customers, appointments, and shop settings
- Appointment creation validates availability and auto-calculates end time
- Sends confirmation emails to both customer and barber via SMTP (Nodemailer)
- Configurable business metadata (name, location, hours) exposed for the frontend

### Setup

1. Duplicate `backend/.env.example` to `backend/.env` and fill in values.
   - `SMTP_*` values are optional but required for email notifications.
2. Install dependencies and start the API server:

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   The API listens on `http://localhost:5000` by default.

## Frontend (React + Vite)

### Features

- Customer booking flow that lists services and compatible barbers, with date + time selection
- Pulls opening/closing hours from the shop settings to build time-slot options
- Admin dashboard with widgets for:
  - Updating business information (hours, contact info)
  - Adding customer profiles with preferences
  - Monitoring upcoming appointments and updating their status

### Setup

1. Duplicate `frontend/.env.example` to `frontend/.env` and point `VITE_API_URL` at the running backend.
2. Install dependencies and run the dev server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The UI is available on `http://localhost:5173` by default.

### Styling

A lightweight design in `frontend/src/styles/global.css` provides a polished, card-based UI with tabs for switching between the booking flow and the admin dashboard.

## Email delivery

The backend uses Nodemailer. Provide valid SMTP credentials in `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`). `SHOP_EMAIL` sets the from-address; otherwise the SMTP username is used.

## Data considerations

- MongoDB collections: `services`, `barbers`, `customers`, `appointments`, `shopsettings`
- `appointments` enforce a unique index on barber + start time to avoid double-booking (except cancelled slots)
- Customer records may be linked to appointments via `customerId` but are optional for quick bookings

## Next steps / enhancements

- Add authentication for the admin dashboard
- Build calendar view + availability rules per barber
- Integrate SMS reminders alongside email notifications
- Add automated tests for controllers and React components
