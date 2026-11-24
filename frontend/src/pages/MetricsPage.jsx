import React, { useState, useEffect } from 'react';
import './MetricsPage.css';
import { getPulseStatisticsUrl } from '../config';

function MetricsPage() {
  const [stats, setStats] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch(getPulseStatisticsUrl());
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data ?? json?.result ?? json;
        if (isMounted && data) {
          setStats(data);
        }
      } catch (e) {
        // silent
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalSubs = stats?.totalSubmissions ?? stats?.submissionsMade ?? 328;
  const solved = stats?.problemsSolved ?? 42;
  const acPercent = stats?.verdicts?.acceptedPercentage != null ? `${stats.verdicts.acceptedPercentage}%` : '68%';
  const teams = stats?.totalTeams || 24;

  const topLangEntry = stats?.languages ? Object.entries(stats.languages)[0] : null;
  const topLangName = topLangEntry ? topLangEntry[0] : 'C++';
  const topLangPct = topLangEntry ? `${topLangEntry[1].percentage}%` : '58%';

  const slides = [
    {
      category: 'РЕШЕНИЯ',
      tag: '01 / ФАКТ',
      number: totalSubs,
      label: 'решений отправлено',
      quote: 'Каждая попытка — шаг к Accepted.',
    },
    {
      category: 'РЕЗУЛЬТАТЫ',
      tag: '02 / ФАКТ',
      number: solved,
      label: 'задач сдано командами',
      quote: 'ХакИТ • Региональный этап • 5 декабря 2026 г.',
    },
    {
      category: 'ТОЧНОСТЬ',
      tag: '03 / ФАКТ',
      number: acPercent,
      label: 'успешных решений (Accepted)',
      quote: 'Качество кода и точность алгоритмов.',
    },
    {
      category: 'ЯЗЫКИ',
      tag: '04 / ФАКТ',
      number: topLangName,
      label: `лидер среди языков (${topLangPct})`,
      quote: 'Выбор участников регионального этапа.',
    },
    {
      category: 'КОНТЕСТ',
      tag: '05 / ФАКТ',
      number: teams,
      label: 'команд в турнирной таблице',
      quote: 'ХакИТ 2026 • 5 декабря • Томск',
    },
  ];

  // Auto-advance slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[slideIndex];
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div
      className="page metricspage"
      onClick={() => setSlideIndex((prev) => (prev + 1) % slides.length)}
    >
      <div className="metricspage__container">
        {/* Top Header */}
        <header className="metricspage__header">
          <div className="metricspage__brand">ХакИТ</div>
          <div className="metricspage__category">{current.category}</div>
        </header>

        <div className="metricspage__divider" />

        {/* Fact Tag */}
        <div className="metricspage__tag-row">
          <span className="metricspage__tag">{current.tag}</span>
        </div>

        {/* Central Metric Value & Label */}
        <main className="metricspage__center">
          <div className="metricspage__number">{current.number}</div>
          <div className="metricspage__label">{current.label}</div>
        </main>

        <div className="metricspage__divider" />

        {/* Bottom Bar */}
        <footer className="metricspage__footer">
          <div className="metricspage__footer-left">
            <div className="metricspage__quote">{current.quote}</div>
            <div className="metricspage__pagination-dashes">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSlideIndex(idx);
                  }}
                  className={`metricspage__dash ${
                    idx === slideIndex ? 'metricspage__dash--active' : ''
                  }`}
                  aria-label={`Слайд ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          <div className="metricspage__counter">
            {pad(slideIndex + 1)} / {pad(slides.length)}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MetricsPage;
