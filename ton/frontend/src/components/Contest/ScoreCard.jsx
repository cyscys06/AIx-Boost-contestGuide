import './ScoreCard.css'

function ScoreCard({ 
  title, 
  score, 
  label, 
  reason, 
  icon,
  inverted = false 
}) {
  const getScoreLevel = () => {
    const effectiveScore = inverted ? 100 - score : score
    if (effectiveScore >= 70) return 'high'
    if (effectiveScore >= 40) return 'medium'
    return 'low'
  }

  const level = getScoreLevel()

  return (
    <div className="score-card">
      <div className="score-card-header">
        {icon && <span className="score-card-icon">{icon}</span>}
        <span className="score-card-title">{title}</span>
      </div>
      
      <div className="score-card-body">
        <div className={`score-card-value ${level}`}>
          {score}
          <span className="score-card-max">/100</span>
        </div>
        {label && (
          <span className={`score-card-label ${level}`}>{label}</span>
        )}
      </div>

      <div className="score-card-bar">
        <div 
          className={`score-card-bar-fill ${level}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {reason && (
        <p className="score-card-reason">{reason}</p>
      )}
    </div>
  )
}

export default ScoreCard
