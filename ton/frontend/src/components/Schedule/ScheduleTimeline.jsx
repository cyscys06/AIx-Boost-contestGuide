import { useState } from 'react'
import { useProfile } from '../../contexts/ProfileContext'
import { useContests } from '../../contexts/ContestsContext'
import { PHASE_STATUS_ORDER } from '../../constants/schedule'
import { DEFAULT_VALUES } from '../../constants/schedule'
import './ScheduleTimeline.css'

function ScheduleTimeline({ contestId }) {
  const { profile, calculateAvailableHours } = useProfile()
  const { getContestById, generateSchedule, removeSchedule, updatePhaseStatus, logDailyProgress } = useContests()
  
  const contest = getContestById(contestId)
  const [showLogModal, setShowLogModal] = useState(false)
  const [logHours, setLogHours] = useState(DEFAULT_VALUES.MIN_HOURS_INCREMENT)

  if (!contest) return null

  const handleGenerateSchedule = () => {
    if (!contest.info?.deadline) {
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

  const handlePhaseClick = (phaseId, currentStatus) => {
    const currentIndex = PHASE_STATUS_ORDER.indexOf(currentStatus)
    const nextStatus = PHASE_STATUS_ORDER[(currentIndex + 1) % PHASE_STATUS_ORDER.length]
    updatePhaseStatus(contestId, phaseId, nextStatus)
  }

  const handleLogProgress = () => {
    logDailyProgress(contestId, logHours)
    setShowLogModal(false)
    setLogHours(DEFAULT_VALUES.MIN_HOURS_INCREMENT)
  }

  // If no schedule, show generate button
  if (!contest.schedule) {
    return (
      <div className="schedule-empty">
        <div className="schedule-empty-icon">—</div>
        <h4>일정 플래너</h4>
        <p>AI가 마감일과 가용 시간을 분석하여<br/>현실적인 일정을 생성해드려요.</p>
        <button 
          className="btn btn-primary"
          onClick={handleGenerateSchedule}
          disabled={!contest.info?.deadline}
        >
          일정 생성하기
        </button>
        {!contest.info?.deadline && (
          <span className="schedule-empty-hint">마감일이 필요해요</span>
        )}
      </div>
    )
  }

  const schedule = contest.schedule
  const today = new Date()

  return (
    <div className="schedule-timeline">
      {/* Header with feasibility */}
      <div className="schedule-header">
        <div className="schedule-title">
          <h4>일정 플래너</h4>
        </div>
        <div className={`feasibility-badge ${schedule.feasibility.verdict.color}`}>
          {schedule.feasibility.verdict.message}
        </div>
      </div>

      {/* Warnings */}
      {schedule.warnings?.length > 0 && (
        <div className="schedule-warnings">
          {schedule.warnings.map((warning, idx) => (
            <div key={idx} className="schedule-warning">
              <span>⚠</span>
              <p>{warning.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress summary */}
      <div className="schedule-summary">
        <div className="summary-item">
          <span className="summary-label">예상 소요</span>
          <span className="summary-value">{schedule.totalEstimatedHours}시간</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">가용 시간</span>
          <span className="summary-value">{schedule.availableHours}시간</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">투자한 시간</span>
          <span className="summary-value">{contest.progress?.actualHoursSpent || 0}시간</span>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="phases-list">
        {schedule.phases.map((phase, idx) => {
          const phaseStart = new Date(phase.startDate)
          const phaseEnd = new Date(phase.endDate)
          const isCurrent = phaseStart <= today && phaseEnd >= today
          const isPast = phaseEnd < today

          return (
            <div 
              key={phase.id}
              className={`phase-item ${phase.status} ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
              onClick={() => handlePhaseClick(phase.id, phase.status)}
            >
              <div className="phase-marker">
                {phase.status === 'completed' ? '✓' : (idx + 1)}
              </div>
              <div className="phase-content">
                <div className="phase-header">
                  <span className="phase-icon">{phase.icon}</span>
                  <span className="phase-label">{phase.label}</span>
                  <span className={`phase-priority ${phase.priority}`}>
                    {phase.priority === 'must' ? '필수' : '선택'}
                  </span>
                </div>
                <div className="phase-meta">
                  <span className="phase-dates">
                    {new Date(phase.startDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    {' ~ '}
                    {new Date(phase.endDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="phase-hours">{phase.estimatedHours}시간</span>
                </div>
              </div>
              <div className="phase-status-indicator">
                {phase.status === 'completed' && <span className="status-done">완료</span>}
                {phase.status === 'in_progress' && <span className="status-active">진행중</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Log progress button */}
      <div className="schedule-actions">
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setShowLogModal(true)}
        >
          오늘 작업 기록
        </button>
        <button 
          className="btn btn-ghost btn-sm"
          onClick={handleGenerateSchedule}
        >
          🔄 일정 재생성
        </button>
        <button 
          className="btn btn-ghost btn-sm schedule-delete-btn"
          onClick={() => {
            if (window.confirm('이 공모전의 일정을 삭제하시겠습니까?')) {
              removeSchedule(contestId)
            }
          }}
        >
          일정 삭제
        </button>
      </div>

      {/* Log progress modal */}
      {showLogModal && (
        <div className="log-modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="log-modal" onClick={e => e.stopPropagation()}>
            <h4>오늘 작업 기록</h4>
            <div className="log-input-group">
              <label>투자한 시간</label>
              <div className="log-hours-input">
                <button onClick={() => setLogHours(Math.max(DEFAULT_VALUES.MIN_HOURS, logHours - DEFAULT_VALUES.MIN_HOURS_INCREMENT))}>-</button>
                <span>{logHours}시간</span>
                <button onClick={() => setLogHours(logHours + DEFAULT_VALUES.MIN_HOURS_INCREMENT)}>+</button>
              </div>
            </div>
            <div className="log-modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLogModal(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleLogProgress}>기록하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduleTimeline
