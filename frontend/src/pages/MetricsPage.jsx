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

  // Find most popular problem from stats
  let popularProblem = 'A';
  let popularProblemRate = '85%';
  if (Array.isArray(stats?.problems) && stats.problems.length > 0) {
    const sorted = [...stats.problems].sort((a, b) => (b.totalSubmissions || 0) - (a.totalSubmissions || 0));
    if (sorted[0]) {
      popularProblem = sorted[0].index || 'A';
      popularProblemRate = sorted[0].solveRate != null ? `${sorted[0].solveRate}%` : '85%';
    }
  }

  const slides = [
    {
      category: 'РЕШЕНИЯ',
      tag: '01 / ФАКТ',
      number: totalSubs,
      label: 'решений отправлено',
      quote: 'Каждая попытка — шаг к Accepted.',
    },
    {
      category: 'ПИТАНИЕ',
      tag: '02 / ФАКТ',
      number: '112',
      label: 'кусков пиццы съедено',
      quote: 'Топливо для решения сложнейших алгоритмов и структур данных.',
    },
    {
      category: 'РЕЗУЛЬТАТЫ',
      tag: '03 / ФАКТ',
      number: solved,
      label: 'задач сдано командами',
      quote: 'ХакИТ • Региональный этап • 5 декабря 2026 г.',
    },
    {
      category: 'ТОЧНОСТЬ',
      tag: '04 / ФАКТ',
      number: acPercent,
      label: 'успешных попыток (Accepted)',
      quote: 'Чистота алгоритмической мысли и точность реализации.',
    },
    {
      category: 'ЯЗЫКИ',
      tag: '05 / ФАКТ',
      number: topLangName,
      label: `лидер среди языков (${topLangPct})`,
      quote: 'Выбор участников олимпиады на этом туре.',
    },
    {
      category: 'ЗАДАЧИ',
      tag: '06 / ФАКТ',
      number: `Задача ${popularProblem}`,
      label: `самая популярная задача (${popularProblemRate} сдали)`,
      quote: 'Главная арена битвы за первые баллы в контесте.',
    },
    {
      category: 'КОНТЕСТ',
      tag: '07 / ФАКТ',
      number: teams,
      label: 'команд борются за кубок',
      quote: 'Томский политехнический университет • 2026',
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
