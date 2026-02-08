import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContests } from '../contexts/ContestsContext'
import { useProfile } from '../contexts/ProfileContext'
import { formatDate, formatDayName, isToday, getDaysLeft, isUrgentDeadline } from '../utils/dateHelpers'
import './SchedulePage.css'

function SchedulePage() {
  const navigate = useNavigate()
  const { contests, allContests, generateSchedule, getTodaysFocus } = useContests()
  const { calculateAvailableHours } = useProfile()

  const today = new Date()
  const [weekOffset, setWeekOffset] = useState(0)
  const todaysFocus = getTodaysFocus()

  // Include both contests and allContests for schedule management
  const allContestsForSchedule = useMemo(() => {
    const savedIds = new Set(contests.map(c => c.id))
    return [
      ...contests,
      ...allContests.filter(ac => !ac.saved || !savedIds.has(ac.savedContestId))
    ]
  }, [contests, allContests])
  
  const scheduledContests = allContestsForSchedule.filter(c => c.schedule && c.info?.deadline)
  const unscheduledContests = allContestsForSchedule.filter(c => !c.schedule && c.info?.deadline)

  // 선택한 주의 날짜 (월~일)
  const weekDates = useMemo(() => {
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      return d
    })
  }, [weekOffset])

  // 이번 주 각 날짜별 이벤트
  const weekEvents = useMemo(() => {
    return weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const events = []

      scheduledContests.forEach(contest => {
        contest.schedule.phases.forEach(phase => {
          const phaseStart = new Date(phase.startDate)
          const phaseEnd = new Date(phase.endDate)
          if (date >= phaseStart && date <= phaseEnd) {
            events.push({
              contestId: contest.id,
              contestTitle: contest.info?.title || '제목 없음',
              phaseLabel: phase.label
            })
          }
        })
        if (dateStr === contest.info?.deadline) {
          events.push({
            contestId: contest.id,
            contestTitle: contest.info?.title || '제목 없음',
            isDeadline: true
          })
        }
      })

      return { date, events }
    })
  }, [weekDates, scheduledContests])

  const handleGenerateSchedule = (contestId) => {
    const contest = allContestsForSchedule.find(c => c.id === contestId)
    if (!contest?.info?.deadline) {
      alert('마감일이 설정되지 않은 공모전입니다.')
      return
    }
    const availableHours = calculateAvailableHours(
      new Date().toISOString(),
      contest.info.deadline
    )
    const result = generateSchedule(contestId, availableHours)
    if (!result) {
      alert('일정 생성에 실패했습니다. 마감일을 확인해주세요.')
    }
  }


  // Empty state
  if (allContestsForSchedule.length === 0) {
    return (
      <div className="page schedule-page">
        <div className="empty-page-container animate-fade-in-up">
          <div className="empty-illustration">
            <span className="empty-emoji">—</span>
          </div>
          <h1>일정을 관리할 공모전이 없어요</h1>
          <p>
            먼저 공모전을 분석하고 추가하면<br />
            AI가 자동으로 일정을 생성해드려요
          </p>
          <div className="empty-cta-group">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/analyze')}>
              포스터 분석하기
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page schedule-page">
      <div className="schedule-page-header animate-fade-in-up">
        <div className="schedule-title-section">
          <h1>일정 관리</h1>
          <p>공모전 준비 일정을 한눈에 확인하고 관리하세요</p>
        </div>
      </div>

      <div className="schedule-content">
        {/* 1. 오늘의 할 일 - 상단 강조 */}
        <section className="schedule-today-section animate-fade-in-up animate-delay-1">
          <h2 className="section-title">
            <span className="section-title-icon">오늘</span>
            오늘의 할 일
          </h2>
          {todaysFocus.length > 0 ? (
            <div className="today-focus-list">
              {todaysFocus.map(item => (
                <div
                  key={item.contestId}
                  className="today-focus-card"
                  onClick={() => navigate(`/contests?id=${item.contestId}`)}
                >
                  <div className="today-focus-main">
                    <span className="today-focus-phase">{item.phase.label}</span>
                    <span className="today-focus-title">{item.contestTitle}</span>
                  </div>
                  <div className="today-focus-meta">
                    <span className={`today-focus-days ${item.urgency}`}>
                      {item.daysLeft < 0
                        ? '마감됨'
                        : item.daysLeft === 0
                          ? '오늘'
                          : `D-${item.daysLeft}`}
                    </span>
                    <span className="today-focus-hours">{item.suggestedHoursToday}시간 권장</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm today-focus-btn"
                    onClick={e => {
                      e.stopPropagation()
                      navigate(`/contests?id=${item.contestId}`)
                    }}
                  >
                    상세 보기
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="today-empty">
              <p>오늘 예정된 일정이 없어요</p>
              <p className="today-empty-hint">이번 주 일정을 확인해보세요</p>
            </div>
          )}
        </section>

        {/* 2. 이번 주 일정 - 간단 리스트 */}
        <section className="schedule-week-section animate-fade-in-up animate-delay-2">
          <div className="schedule-week-header">
            <h2 className="section-title">이번 주 일정</h2>
            <div className="week-navigation">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setWeekOffset(prev => prev - 1)}
              >
                ← 이전 주
              </button>
              <span className="week-label">
                {formatDate(weekDates[0])} ~ {formatDate(weekDates[6])}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setWeekOffset(prev => prev + 1)}
              >
                다음 주 →
              </button>
              {weekOffset !== 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setWeekOffset(0)}
                >
                  오늘
                </button>
              )}
            </div>
          </div>
          <div className="week-list">
            {weekEvents.map(({ date, events }) => (
              <div
                key={date.toISOString()}
                className={`week-list-day ${isToday(date, today) ? 'today' : ''}`}
              >
                <div className="week-list-day-header">
                  <span className="week-list-day-name">{formatDayName(date)}</span>
                  <span className="week-list-day-date">{formatDate(date)}</span>
                  {isToday(date) && <span className="week-list-today-badge">오늘</span>}
                </div>
                <div className="week-list-day-events">
                  {events.length > 0 ? (
                    events.map((ev, idx) => (
                      <div
                        key={idx}
                        className={`week-list-event ${ev.isDeadline ? 'deadline' : ''}`}
                        onClick={() => navigate(`/contests?id=${ev.contestId}`)}
                      >
                        {ev.isDeadline ? (
                          <span className="week-event-deadline">마감</span>
                        ) : (
                          <span className="week-event-phase">{ev.phaseLabel}</span>
                        )}
                        <span className="week-event-title">{ev.contestTitle}</span>
                      </div>
                    ))
                  ) : (
                    <span className="week-list-empty">일정 없음</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 다가오는 마감 + 일정 미생성 */}
        <section className="schedule-summary-section animate-fade-in-up animate-delay-3">
          <div className="summary-card deadlines-card">
            <h3>다가오는 마감</h3>
            {scheduledContests.length > 0 ? (
              scheduledContests
                .sort((a, b) => new Date(a.info.deadline) - new Date(b.info.deadline))
                .slice(0, 5)
                .map(contest => (
                  <div
                    key={contest.id}
                    className="deadline-item"
                    onClick={() => navigate(`/contests?id=${contest.id}`)}
                  >
                    <span className="deadline-title">{contest.info.title}</span>
                    <span
                      className={`deadline-days ${isUrgentDeadline(contest.info.deadline, today) ? 'urgent' : ''}`}
                    >
                      {getDaysLeft(contest.info.deadline, today)}
                    </span>
                  </div>
                ))
            ) : (
              <p className="no-deadlines">예정된 마감이 없습니다</p>
            )}
          </div>

          {unscheduledContests.length > 0 && (
            <div className="summary-card unscheduled-card">
              <h3>일정 미생성</h3>
              <p className="unscheduled-hint">일정을 생성하면 체계적으로 준비할 수 있어요</p>
              {unscheduledContests.slice(0, 4).map(contest => (
                <div key={contest.id} className="unscheduled-item">
                  <span className="unscheduled-title">{contest.info?.title || '제목 없음'}</span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleGenerateSchedule(contest.id)}
                  >
                    일정 생성
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default SchedulePage
