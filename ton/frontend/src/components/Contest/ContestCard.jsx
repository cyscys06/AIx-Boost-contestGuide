import { useNavigate } from 'react-router-dom'
import './ContestCard.css'

function ContestCard({ contest, compact = false }) {
  const navigate = useNavigate()
  
  const { info, analysis, userProgress } = contest
  
  // Calculate days until deadline
  const getDaysLeft = () => {
    if (!info?.deadline) return null
    const deadline = new Date(info.deadline)
    const now = new Date()
    const days = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
    return days
  }
  
  const daysLeft = getDaysLeft()
  
  const getUrgencyClass = () => {
    if (!daysLeft) return ''
    if (daysLeft <= 7) return 'urgent'
    if (daysLeft <= 14) return 'warning'
    return ''
  }
  
  const getScoreLevel = (score) => {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  const handleClick = () => {
    navigate(`/contests?id=${contest.id}`)
  }

  if (compact) {
    return (
      <div className="contest-card compact" onClick={handleClick}>
        <div className="contest-card-header">
          {info?.thumbnail ? (
            <img
              src={info.thumbnail}
              alt=""
              className="contest-card-thumbnail"
            />
          ) : (
            <div className="contest-card-thumbnail-placeholder" />
          )}
          <div className="contest-card-header-content">
            <h4 className="contest-card-title">{info?.title || '제목 없음'}</h4>
            {daysLeft !== null && (
              <span className={`contest-card-deadline ${getUrgencyClass()}`}>
                D-{daysLeft}
              </span>
            )}
          </div>
        </div>
        {analysis?.scores?.readiness && (
          <div className="contest-card-score-bar">
            <div 
              className={`contest-card-score-fill ${getScoreLevel(analysis.scores.readiness.score)}`}
              style={{ width: `${analysis.scores.readiness.score}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="contest-card" onClick={handleClick}>
      <div className="contest-card-header">
        <div className="contest-card-meta">
          {info?.category && (
            <span className="badge badge-neutral">{info.category}</span>
          )}
          {daysLeft !== null && (
            <span className={`contest-card-deadline ${getUrgencyClass()}`}>
              D-{daysLeft}
            </span>
          )}
        </div>
        <h3 className="contest-card-title">{info?.title || '제목 없음'}</h3>
        {info?.organizer && (
          <p className="contest-card-organizer">{info.organizer}</p>
        )}
      </div>

      {analysis?.scores && (
        <div className="contest-card-scores">
          <ScoreIndicator 
            label="적합도" 
            score={analysis.scores.skillMatch?.score} 
          />
          <ScoreIndicator 
            label="준비도" 
            score={analysis.scores.readiness?.score} 
          />
          <ScoreIndicator 
            label="난이도" 
            score={analysis.scores.difficulty?.score}
            inverted 
          />
        </div>
      )}

      {analysis?.recommendation && (
        <p className="contest-card-recommendation">
          "{analysis.recommendation.slice(0, 80)}..."
        </p>
      )}

      {userProgress?.priority && (
        <div className="contest-card-footer">
          <span className={`badge badge-${userProgress.priority === 'high' ? 'danger' : userProgress.priority === 'medium' ? 'warning' : 'neutral'}`}>
            {userProgress.priority === 'high' ? '높은 우선순위' : userProgress.priority === 'medium' ? '중간 우선순위' : '낮은 우선순위'}
          </span>
        </div>
      )}
    </div>
  )
}

function ScoreIndicator({ label, score, inverted = false }) {
  if (score === undefined || score === null) return null
  
  const getLevel = () => {
    const effectiveScore = inverted ? 100 - score : score
    if (effectiveScore >= 70) return 'high'
    if (effectiveScore >= 40) return 'medium'
    return 'low'
  }
  
  return (
    <div className="score-indicator">
      <span className="score-indicator-label">{label}</span>
      <div className="score-indicator-dots">
        {[1, 2, 3, 4, 5].map(i => (
          <span 
            key={i} 
            className={`score-indicator-dot ${i <= Math.ceil(score / 20) ? getLevel() : ''}`}
          />
        ))}
      </div>
    </div>
  )
}

export default ContestCard
