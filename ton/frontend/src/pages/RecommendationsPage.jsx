import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContests } from '../contexts/ContestsContext'
import './RecommendationsPage.css'

function RecommendationsPage() {
  const navigate = useNavigate()
  const { allContests, contests, addContest, removeFromAllContests, removeContest } = useContests()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedCard, setExpandedCard] = useState(null)
  const [savingId, setSavingId] = useState(null)

  const categories = useMemo(() => {
    const cats = new Set(['all'])
    allContests.forEach(c => {
      if (c.info?.category) cats.add(c.info.category)
    })
    return Array.from(cats)
  }, [allContests])

  const filteredContests = useMemo(() => {
    if (selectedCategory === 'all') return allContests
    return allContests.filter(c => c.info?.category === selectedCategory)
  }, [allContests, selectedCategory])

  const getDisplayContest = (contest) => {
    const info = contest.info || {}
    const analysis = contest.analysis || {}
    const isSaved = contest.saved === true
    const strategicScore = analysis.scores?.skillMatch?.score ?? analysis.scores?.readiness?.score ?? 0
    const requirements = Array.isArray(info.requirements)
      ? info.requirements
      : info.requirements
        ? [info.requirements]
        : []
    const benefits = Array.isArray(analysis.opportunities)
      ? analysis.opportunities
      : Array.isArray(info.prizes)
        ? info.prizes
        : []
    const daysLeft = getDaysLeft(info.deadline)

    return {
      id: contest.id,
      saved: isSaved,
      savedContestId: contest.savedContestId,
      title: info.title || '제목 없음',
      organizer: info.organizer || '',
      category: info.category || '기타',
      deadline: info.deadline || '',
      daysLeft,
      prize: Array.isArray(info.prizes)
        ? info.prizes.join(', ')
        : info.prizes || '-',
      teamSize: info.teamSize || '-',
      description: info.description || '',
      requirements: requirements.slice(0, 4),
      benefits: benefits.slice(0, 4),
      tags: [],
      match: {
        score: strategicScore,
        reasons: analysis.recommendation ? [analysis.recommendation] : ['분석 정보 없음'],
        matchedSkills: [],
        warnings: analysis.concerns || []
      }
    }
  }

  const handleViewDetail = (savedContestId) => {
    navigate(`/contests?id=${savedContestId}`)
  }

  const handleSaveToMyContests = (contest) => {
    setSavingId(contest.id)
    const contestData = {
      info: contest.info,
      analysis: contest.analysis,
      userProgress: contest.userProgress || { checklist: [], notes: '', priority: 'medium' }
    }
    const contestId = addContest(contestData, { allContestId: contest.id })
    setSavingId(null)
    navigate(`/contests?id=${contestId}`)
  }

  const handleDelete = (contest) => {
    if (!window.confirm(`"${contest.info?.title || '이 공모전'}"을(를) 전체 공모전에서 삭제하시겠습니까?`)) return
    removeFromAllContests(contest.id)
    if (contest.saved && contest.savedContestId) {
      removeContest(contest.savedContestId)
    }
    if (expandedCard === contest.id) setExpandedCard(null)
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  const getDaysLeft = (deadline) => {
    if (!deadline) return 999
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  }

  const formatDeadline = (deadline) => {
    if (!deadline) return '-'
    const date = new Date(deadline)
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  }

  return (
    <div className="page recommendations-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            전체 공모전
          </h1>
          <p className="hero-subtitle">
            추가한 모든 공모전을 한눈에 확인하세요.
          </p>

          {/* Quick Stats */}
          <div className="stats-grid" style={{ marginTop: 'var(--space-4)', maxWidth: '400px' }}>
            <div className="stat-card">
              <div className="stat-card-value">{allContests.length}</div>
              <div className="stat-card-label">전체 공모전</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">{contests.length}</div>
              <div className="stat-card-label">저장한 공모전</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-value">
                {allContests.filter(c => getDaysLeft(c.info?.deadline) <= 30 && getDaysLeft(c.info?.deadline) >= 0).length}
              </div>
              <div className="stat-card-label">마감 임박</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-title-icon">📋</span>
          공모전 목록
        </h2>
        <div className="filter-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? '전체' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Contests Grid */}
      {filteredContests.length > 0 ? (
        <div className="recommendations-grid">
          {filteredContests.map((contest) => {
            const display = getDisplayContest(contest)
            return (
              <div
                key={contest.id}
                className={`recommendation-card ${expandedCard === contest.id ? 'expanded' : ''}`}
              >
                <div className="recommendation-card-header">
                  <div className="recommendation-card-header-left">
                    <span className="recommendation-card-category">
                      {display.category}
                    </span>
                    <button
                      type="button"
                      className="recommendation-card-delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(contest) }}
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                  <div className="match-score-ring">
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle className="bg" cx="28" cy="28" r="24" />
                      <circle
                        className="progress"
                        cx="28"
                        cy="28"
                        r="24"
                        style={{
                          strokeDasharray: `${2 * Math.PI * 24}`,
                          strokeDashoffset: `${2 * Math.PI * 24 * (1 - display.match.score / 100)}`,
                          stroke: `var(--color-score-${getScoreColor(display.match.score)})`
                        }}
                      />
                    </svg>
                    <span className="match-score-value" style={{ color: `var(--color-score-${getScoreColor(display.match.score)})` }}>
                      {display.match.score}
                    </span>
                  </div>
                </div>

                <h3 className="recommendation-card-title">{display.title}</h3>
                <p className="recommendation-card-organizer">{display.organizer}</p>

                {/* Summary / Reason */}
                <div className="recommendation-card-reason">
                  <div className="recommendation-card-reason-title">
                    분석 요약
                  </div>
                  <p className="recommendation-card-reason-text">
                    {display.match.reasons[0]}
                  </p>
                </div>

                {/* Warning if any */}
                {display.match.warnings.length > 0 && (
                  <div className="recommendation-warning">
                    {display.match.warnings[0]}
                  </div>
                )}

                {/* Meta Info */}
                <div className="recommendation-card-meta">
                  <div className="recommendation-card-meta-item">
                    <strong>{formatDeadline(display.deadline)}</strong>
                    {display.deadline && (
                      <span className={`deadline-badge ${display.daysLeft >= 0 && display.daysLeft <= 14 ? 'urgent' : ''}`}>
                        {display.daysLeft >= 0 ? `D-${display.daysLeft}` : '마감됨'}
                      </span>
                    )}
                  </div>
                  <div className="recommendation-card-meta-item">
                    <strong>{display.teamSize}</strong>
                  </div>
                  {display.prize !== '-' && (
                    <div className="recommendation-card-meta-item">
                      <strong>{display.prize}</strong>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {expandedCard === contest.id && (
                  <div className="recommendation-card-expanded">
                    <div className="divider" />
                    {display.description && (
                      <p className="recommendation-card-description">
                        {display.description}
                      </p>
                    )}

                    <div className="recommendation-card-details">
                      {display.requirements.length > 0 && (
                        <div className="detail-section">
                          <h4>참가 요건</h4>
                          <ul>
                            {display.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {display.benefits.length > 0 && (
                        <div className="detail-section">
                          <h4>참가 혜택</h4>
                          <ul>
                            {display.benefits.map((benefit, idx) => (
                              <li key={idx}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="recommendation-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setExpandedCard(expandedCard === contest.id ? null : contest.id)}
                  >
                    {expandedCard === contest.id ? '접기' : '자세히 보기'}
                  </button>
                  {display.saved ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleViewDetail(display.savedContestId)}
                    >
                      상세 보기
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSaveToMyContests(contest)}
                      disabled={savingId === contest.id}
                    >
                      {savingId === contest.id ? '저장 중...' : '내 공모전에 추가'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-illustration">
          <div className="empty-illustration-icon">—</div>
          <h3 className="empty-illustration-title">등록된 공모전이 없습니다</h3>
          <p className="empty-illustration-desc">
            AI 분석이나 직접 추가로 공모전을 등록해 보세요.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/analyze')}
          >
            공모전 분석하기
          </button>
        </div>
      )}
    </div>
  )
}

export default RecommendationsPage
