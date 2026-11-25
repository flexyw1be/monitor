import React, { useRef } from 'react';
import CountdownTimer from '../components/CountdownTimer';
import './Home.css';
import dayjs from 'dayjs';

const formatTarget = (value) => {
  if (!value) return null;
  return value.replace(' ', 'T');
};

function Home({ staffData }) {
  const fallbackRef = useRef(
    dayjs('2026-12-05T15:00:00').isValid()
      ? '2026-12-05T15:00:00'
      : dayjs().add(2, 'hour').format('YYYY-MM-DDTHH:mm:ss')
  );

  const targetDate =
    formatTarget(staffData?.pulse_timer_end_time) ?? fallbackRef.current;

  return (
    <div className="page home">
      <div className="home__container">
        {/* Top Header */}
        <header className="home__header">
          <div className="home__brand">ХакИТ 2026</div>
          <div className="home__tag">ТПУ • ИШИТР</div>
        </header>

        <div className="home__divider" />

        {/* Hero Section */}
        <main className="home__hero">
          <div className="home__org">
            Национальный исследовательский Томский политехнический университет
          </div>

          <h1 className="home__title">ХакИТ 2026</h1>

          <div className="home__subtitle">
            Командная олимпиада по спортивному программированию
          </div>

          <div className="home__meta-row">
            <span className="home__meta-item">
              5 декабря 2026 года
            </span>
          </div>

          {/* Official Timer Box */}
          <div className="home__timer-card">
            <div className="home__timer-label">ВРЕМЯ ДО ЗАВЕРШЕНИЯ ТУРА</div>
            <div className="home__timer-display">
              <CountdownTimer targetDate={targetDate} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
