import CountdownTimer from "../components/CountdownTimer";
import WinterStorm from "../components/WinterStorm";
import "./Home.css";
import dayjs from "dayjs";
import { useRef } from "react";

const formatTarget = (value) => {
  if (!value) return null;
  return value.replace(" ", "T");
};

function Home({ staffData }) {
  const fallbackRef = useRef(
    dayjs("2026-12-05T15:00:00").isValid()
      ? "2026-12-05T15:00:00"
      : dayjs().add(2, "hour").format("YYYY-MM-DDTHH:mm:ss")
  );

  const targetDate =
    formatTarget(staffData?.pulse_timer_end_time) ?? fallbackRef.current;
  const titleRef = useRef(null);

  return (
    <div className="page home">
      <WinterStorm titleRef={titleRef} />

      <div className="side-ui">
        <div className="glass-panel">
          <div className="panel-content">
            <div className="title" ref={titleRef}>HackIT</div>

            <div className="title2">
              Командная олимпиада по программированию
            </div>

            <div className="stage-badge">Региональный этап</div>

            <div className="title3">
              Россия, Томск, НТБ ТПУ • 5 декабря 2026 г.
            </div>
          </div>

          <div className="panel-bottom">
            <div className="timer-wrap">
              <CountdownTimer targetDate={targetDate} />
            </div>
          </div>
        </div>
      </div>

      <div className="home-scroll-space" aria-hidden="true" />
    </div>
  );
}

export default Home;
