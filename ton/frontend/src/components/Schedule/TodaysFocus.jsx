import { useNavigate } from 'react-router-dom'
import { useContests } from '../../contexts/ContestsContext'
import './TodaysFocus.css'

function TodaysFocus() {
  const navigate = useNavigate()
  const { getTodaysFocus } = useContests()
  
  const focusItems = getTodaysFocus()
  const topFocus = focusItems[0]

  if (!topFocus) {
    return (
      <div className="todays-focus empty">
        <div className="focus-header">
          <span className="focus-icon"></span>
          <h3>오늘의 집중</h3>
        </div>
        <div className="focus-empty-content">
          <p>진행 중인 공모전이 없어요</p>
          <span>공모전을 추가하고 일정을 생성해보세요</span>
        </div>
      </div>
    )
  }

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'high': return { text: '긴급', class: 'urgent' }
      case 'medium': return { text: '주의', class: 'warning' }
      default: return { text: '여유', class: 'normal' }
    }
  }

  const urgencyInfo = getUrgencyLabel(topFocus.urgency)

  return (
    <div className={`todays-focus ${topFocus.isBehind ? 'behind' : ''}`}>
      <div className="focus-header">
        <span className="focus-icon"></span>
        <h3>오늘의 집중</h3>
        <span className={`focus-urgency ${urgencyInfo.class}`}>
          {urgencyInfo.text}
        </span>
      </div>

      <div className="focus-contest" onClick={() => navigate(`/contests?id=${topFocus.contestId}`)}>
        <h4>{topFocus.contestTitle}</h4>
        <div className="focus-phase">
          <span className="phase-icon">{topFocus.phase.icon}</span>
          <span className="phase-label">{topFocus.phase.label}</span>
          <span className="days-left">D-{topFocus.daysLeft}</span>
        </div>
      </div>

      <div className="focus-message">
        {topFocus.isBehind ? (
          <div className="behind-warning">
            <span>⚠</span>
            <p>일정보다 조금 늦어지고 있어요. 오늘 <strong>{topFocus.suggestedHoursToday}시간</strong> 투자하면 따라잡을 수 있어요.</p>
          </div>
        ) : (
          <p>
            <strong>{topFocus.phase.label}</strong> 단계에 집중하세요. 
            오늘 {topFocus.suggestedHoursToday}시간 정도 투자하면 좋아요.
          </p>
        )}
      </div>

      {focusItems.length > 1 && (
        <div className="focus-others">
          <span className="others-label">다른 진행 중:</span>
          {focusItems.slice(1, 3).map(item => (
            <span 
              key={item.contestId} 
              className="other-contest"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/contests?id=${item.contestId}`)
              }}
            >
              {item.contestTitle.length > 15 
                ? item.contestTitle.slice(0, 15) + '...' 
                : item.contestTitle}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default TodaysFocus
