import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './MetricsPage.css';
import { getPulseStatisticsUrl } from '../config';

const SLIDE_INTERVAL_MS = 5500; // 5.5 секунд на один факт

function MetricsPage() {
  const [stats, setStats] = useState(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef(null);

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

  // Самая популярная задача по числу отправок
  let popularProblem = 'A';
  let popularProblemRate = '85%';
  if (Array.isArray(stats?.problems) && stats.problems.length > 0) {
    const sorted = [...stats.problems].sort((a, b) => (b.totalSubmissions || 0) - (a.totalSubmissions || 0));
    if (sorted[0]) {
      popularProblem = sorted[0].index || 'A';
      popularProblemRate = sorted[0].solveRate != null ? `${sorted[0].solveRate}%` : '85%';
    }
  }

  // Задача с самым высоким процентом решаемости (AC/Reject ratio)
  let highestRatioProblem = 'A';
  let highestRatioPct = '82%';
  if (Array.isArray(stats?.problems) && stats.problems.length > 0) {
    const withAttempts = stats.problems.filter((p) => (p.totalSubmissions || 0) > 0);
    const pool = withAttempts.length > 0 ? withAttempts : stats.problems;
    const sortedByRatio = [...pool].sort(
      (a, b) => (b.submissionAcceptRate ?? b.solveRate ?? 0) - (a.submissionAcceptRate ?? a.solveRate ?? 0)
    );
    if (sortedByRatio[0]) {
      highestRatioProblem = sortedByRatio[0].index || 'A';
      highestRatioPct = `${sortedByRatio[0].submissionAcceptRate ?? sortedByRatio[0].solveRate ?? 82}%`;
    }
  }

  const pad = (n) => String(n).padStart(2, '0');

  const slides = useMemo(() => {
    const rawSlides = [
      {
        category: 'РЕШЕНИЯ',
        number: totalSubs,
        label: 'решений отправлено',
        quote: 'Каждая попытка — шаг к Accepted.',
      },
      {
        category: 'ПЕРВОЕ РЕШЕНИЕ',
        number: 'Задача F',
        label: 'команда «чапман ред» открыла контест',
        quote: 'Первая успешная сдача в сегодняшнем туре соревнований.',
      },
      {
        category: 'УЧАСТНИКИ',
        number: '98',
        label: 'человек участвуют в олимпиаде',
        quote: 'Сборные команды лучших программистов региона.',
      },
      {
        category: 'ПИТАНИЕ',
        number: '112',
        label: 'кусков пиццы съедено',
        quote: 'Топливо для решения сложнейших алгоритмов и структур данных.',
      },
      {
        category: 'МАРАФОН',
        number: '5 часов',
        label: 'длилась упорная борьба за победу',
        quote: '300 минут непрерывного мозгового штурма и оптимизации кода.',
      },
      {
        category: 'РЕШАЕМОСТЬ',
        number: `Задача ${highestRatioProblem}`,
        label: `самый высокий процент сдачи AC/Reject (${highestRatioPct})`,
        quote: 'Задача с наилучшей конверсией успешных попыток среди участников.',
      },
      {
        category: 'ТЕСТЫ',
        number: '49',
        label: 'максимальный тест, на котором был Reject',
        quote: 'Беспощадные скрытые краевые стресс-тесты от жюри контеста.',
      },
      {
        category: 'ТОЧНОСТЬ',
        number: acPercent,
        label: 'успешных попыток (Accepted)',
        quote: 'Чистота алгоритмической мысли и точность реализации.',
      },
      {
        category: 'ЯЗЫКИ',
        number: topLangName,
        label: `лидер среди языков (${topLangPct})`,
        quote: 'Выбор участников олимпиады на этом туре.',
      },
      {
        category: 'РЕЗУЛЬТАТЫ',
        number: solved,
        label: 'задач сдано суммарно командами',
        quote: 'ХакИТ • 5 декабря 2026 г.',
      },
      {
        category: 'ЗАДАЧИ',
        number: `Задача ${popularProblem}`,
        label: `самая популярная задача (${popularProblemRate} сдали)`,
        quote: 'Главная арена битвы за первые баллы в контесте.',
      },
      {
        category: 'КОНТЕСТ',
        number: teams,
        label: 'команд соревнуются за кубок',
        quote: 'ХакИТ 2026 • Национальный исследовательский ТПУ',
      },
    ];

    return rawSlides.map((s, idx) => ({
      ...s,
      tag: `${pad(idx + 1)} / ФАКТ`,
    }));
  }, [totalSubs, solved, acPercent, teams, topLangName, topLangPct, popularProblem, popularProblemRate, highestRatioProblem, highestRatioPct]);

  // Плавное переключение слайда с анимацией затухания и появления
  const goToSlide = useCallback((nextIndex) => {
    setIsTransitioning(true);
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setSlideIndex(nextIndex);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 40);
    }, 320);
  }, []);

  // Автопереключение каждые 5-6 секунд (5500 мс)
  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((slideIndex + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [slideIndex, slides.length, goToSlide]);

  const current = slides[slideIndex] || slides[0];
  const fadeClass = isTransitioning ? 'metricspage__fade--out' : 'metricspage__fade--in';

  return (
    <div
      className="page metricspage"
      onClick={() => {
        if (!isTransitioning) {
          goToSlide((slideIndex + 1) % slides.length);
        }
      }}
    >
      <div className="metricspage__container">
        {/* Top Header */}
        <header className="metricspage__header">
          <div className="metricspage__brand">ХакИТ</div>
          <div className={`metricspage__category ${fadeClass}`}>{current.category}</div>
        </header>

        <div className="metricspage__divider" />

        {/* Fact Tag */}
        <div className="metricspage__tag-row">
          <span className={`metricspage__tag ${fadeClass}`}>{current.tag}</span>
        </div>

        {/* Central Metric Value & Label with smooth cross-fade */}
        <main className={`metricspage__center ${fadeClass}`}>
          <div className="metricspage__number">{current.number}</div>
          <div className="metricspage__label">{current.label}</div>
        </main>

        <div className="metricspage__divider" />

        {/* Bottom Bar */}
        <footer className="metricspage__footer">
          <div className="metricspage__footer-left">
            <div className={`metricspage__quote ${fadeClass}`}>{current.quote}</div>
            <div className="metricspage__pagination-dashes">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isTransitioning && idx !== slideIndex) {
                      goToSlide(idx);
                    }
                  }}
                  className={`metricspage__dash ${
                    idx === slideIndex ? 'metricspage__dash--active' : ''
                  }`}
                  aria-label={`Слайд ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          <div className={`metricspage__counter ${fadeClass}`}>
            {pad(slideIndex + 1)} / {pad(slides.length)}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default MetricsPage;
