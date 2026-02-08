import { useNavigate } from 'react-router-dom'
import { useContests } from '../contexts/ContestsContext'
import './TimelinePage.css'

function TimelinePage() {
  const navigate = useNavigate()
  const { contests, getUpcomingContests } = useContests()

  // Build action-oriented timeline
  const buildTimeline = () => {
    const items = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    contests.forEach(contest => {
      if (!contest.info?.deadline) return
      
      const deadline = new Date(contest.info.deadline)
      const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
      
      if (daysLeft < 0) return // Skip past deadlines

      // Add deadline item
      items.push({
        id: `deadline_${contest.id}`,
        contestId: contest.id,
        type: 'deadline',
        title: contest.info.title,
        description: '마감일',
        date: deadline,
        daysLeft,
        priority: daysLeft <= 3 ? 'urgent' : daysLeft <= 7 ? 'high' : 'normal'
      })

      // Add uncompleted checklist items
      contest.userProgress?.checklist?.forEach((item, idx) => {
        if (item.done) return
        
        // Estimate date based on deadline (spread evenly)
        const itemDate = new Date(today.getTime() + (daysLeft * 0.3 * idx * 24 * 60 * 60 * 1000))
        if (itemDate > deadline) return

        items.push({
          id: `task_${contest.id}_${item.id}`,
          contestId: contest.id,
          type: 'task',
          title: item.text,
          description: contest.info.title,
          date: itemDate,
          daysLeft: Math.ceil((itemDate - today) / (1000 * 60 * 60 * 24)),
          priority: 'normal'
        })
      })
    })

    // Sort by date
    items.sort((a, b) => a.date - b.date)

    return items
  }

  const timelineItems = buildTimeline()

  // Group items by relative time
  const groupItems = (items) => {
    const groups = {
      today: [],
      thisWeek: [],
      nextWeek: [],
      later: []
    }

    items.forEach(item => {
      if (item.daysLeft <= 0) {
        groups.today.push(item)
      } else if (item.daysLeft <= 7) {
        groups.thisWeek.push(item)
      } else if (item.daysLeft <= 14) {
        groups.nextWeek.push(item)
      } else {
        groups.later.push(item)
      }
    })

    return groups
  }

  const groupedItems = groupItems(timelineItems)

  const handleItemClick = (contestId) => {
    navigate(`/contests?id=${contestId}`)
  }

  if (contests.length === 0) {
    return (
      <div className="page timeline-page">
        <div className="page-header">
          <h1 className="page-title">타임라인</h1>
          <p className="page-subtitle">다음에 해야 할 일을 확인하세요.</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">—</div>
          <p className="empty-state-title">일정이 없습니다</p>
          <p>공모전을 추가하면 타임라인이 생성됩니다.</p>
          <button 
            className="btn btn-primary mt-4"
            onClick={() => navigate('/analyze')}
          >
            공모전 분석하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page timeline-page">
      <div className="page-header">
        <h1 className="page-title">타임라인</h1>
        <p className="page-subtitle">다음에 해야 할 일에 집중하세요.</p>
      </div>

      <div className="timeline-container">
        {/* Today */}
        {groupedItems.today.length > 0 && (
          <TimelineGroup 
            title="오늘" 
            items={groupedItems.today}
            urgent
            onItemClick={handleItemClick}
          />
        )}

        {/* This Week */}
        {groupedItems.thisWeek.length > 0 && (
          <TimelineGroup 
            title="이번 주" 
            items={groupedItems.thisWeek}
            onItemClick={handleItemClick}
          />
        )}

        {/* Next Week */}
        {groupedItems.nextWeek.length > 0 && (
          <TimelineGroup 
            title="다음 주" 
            items={groupedItems.nextWeek}
            onItemClick={handleItemClick}
          />
        )}

        {/* Later */}
        {groupedItems.later.length > 0 && (
          <TimelineGroup 
            title="이후" 
            items={groupedItems.later}
            faded
            onItemClick={handleItemClick}
          />
        )}

        {timelineItems.length === 0 && (
          <div className="timeline-empty">
            <p>예정된 일정이 없습니다.</p>
            <p>공모전에 체크리스트를 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TimelineGroup({ title, items, urgent, faded, onItemClick }) {
  return (
    <div className={`timeline-group ${urgent ? 'urgent' : ''} ${faded ? 'faded' : ''}`}>
      <h2 className="timeline-group-title">{title}</h2>
      <div className="timeline-group-items">
        {items.map(item => (
          <div 
            key={item.id}
            className={`timeline-item timeline-item-${item.type} ${item.priority === 'urgent' ? 'urgent' : ''}`}
            onClick={() => onItemClick(item.contestId)}
          >
            <div className="timeline-item-marker">
              {item.type === 'deadline' ? '●' : '○'}
            </div>
            <div className="timeline-item-content">
              <h3 className="timeline-item-title">{item.title}</h3>
              <p className="timeline-item-desc">{item.description}</p>
            </div>
            <div className="timeline-item-meta">
              {item.daysLeft === 0 ? (
                <span className="timeline-item-date urgent">오늘</span>
              ) : (
                <span className={`timeline-item-date ${item.daysLeft <= 3 ? 'urgent' : ''}`}>
                  D-{item.daysLeft}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TimelinePage
