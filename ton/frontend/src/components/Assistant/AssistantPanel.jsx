import { useNavigate } from 'react-router-dom'
import { useAssistant } from '../../contexts/AssistantContext'
import './AssistantPanel.css'

function AssistantPanel() {
  const navigate = useNavigate()
  const { 
    isMinimized, 
    currentMessage, 
    toggleMinimized, 
    getDeadlinesList 
  } = useAssistant()

  const deadlines = getDeadlinesList()

  const handleAction = () => {
    if (currentMessage?.action?.path) {
      navigate(currentMessage.action.path)
    }
  }

  if (isMinimized) {
    return (
      <div className="assistant-minimized" onClick={toggleMinimized}>
        <div className="assistant-minimized-icon">💬</div>
        {deadlines.some(d => d.isUrgent) && (
          <div className="assistant-minimized-badge" />
        )}
      </div>
    )
  }

  return (
    <aside className="assistant-panel">
      <div className="assistant-header">
        <div className="assistant-avatar">
          <span className="assistant-avatar-icon">🎯</span>
        </div>
        <div className="assistant-title">
          <h3>Contest Guide</h3>
          <span className="assistant-subtitle">AI 어시스턴트</span>
        </div>
        <button className="assistant-minimize" onClick={toggleMinimized}>
          ─
        </button>
      </div>

      <div className="assistant-content">
        {currentMessage && (
          <div className={`assistant-message assistant-message-${currentMessage.type}`}>
            <p className="assistant-message-text">{currentMessage.text}</p>
            {currentMessage.action && (
              <button 
                className="btn btn-primary btn-sm assistant-action-btn"
                onClick={handleAction}
              >
                {currentMessage.action.label}
              </button>
            )}
          </div>
        )}

        {deadlines.length > 0 && (
          <div className="assistant-deadlines">
            <h4 className="assistant-section-title">다가오는 마감</h4>
            <ul className="assistant-deadline-list">
              {deadlines.map(deadline => (
                <li 
                  key={deadline.id} 
                  className={`assistant-deadline-item ${deadline.isUrgent ? 'urgent' : ''}`}
                >
                  <span className="assistant-deadline-title">{deadline.title}</span>
                  <span className="assistant-deadline-days">
                    D-{deadline.daysLeft}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="assistant-footer">
        <button 
          className="btn btn-ghost btn-sm btn-full"
          onClick={() => navigate('/analyze')}
        >
          + 새 공모전 분석
        </button>
      </div>
    </aside>
  )
}

export default AssistantPanel
