import { useState } from 'react';
import BookingPage from './pages/BookingPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

const TABS = {
  BOOK: 'book',
  ADMIN: 'admin'
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.BOOK);

  return (
    <div className="container">
      <header className="navbar">
        <div>
          <div className="tag">Fade Factory</div>
          <h1 style={{ marginBottom: 0 }}>Barber Appointment Scheduler</h1>
        </div>
        <nav className="tab-bar">
          <button
            type="button"
            className={`tab-button ${activeTab === TABS.BOOK ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.BOOK)}
          >
            Book Appointment
          </button>
          <button
            type="button"
            className={`tab-button ${activeTab === TABS.ADMIN ? 'active' : ''}`}
            onClick={() => setActiveTab(TABS.ADMIN)}
          >
            Admin Dashboard
          </button>
        </nav>
      </header>

      {activeTab === TABS.BOOK ? <BookingPage /> : <AdminDashboard />}
    </div>
  );
}
