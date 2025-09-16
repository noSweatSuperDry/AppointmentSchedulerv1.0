import dotenv from 'dotenv';

dotenv.config();

export const {
  PORT = 5000,
  MONGO_URI = 'mongodb+srv://testDb:snip33r!#@appointmentdata.rnxfbzm.mongodb.net/',
  CLIENT_URL = 'http://localhost:5173',
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SHOP_EMAIL
} = process.env;
