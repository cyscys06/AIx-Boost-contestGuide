import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../contexts/ProfileContext'
import { useContests } from '../contexts/ContestsContext'
import AddContestModal from '../components/Contest/AddContestModal'
import './DashboardPage.css'

function DashboardPage() {
  const navigate = useNavigate()
  const { profile, isProfileComplete } = useProfile()
  const { 
    contests,
    allContests,
    getUpcomingContests, 
    getUrgentContests, 
    getTodaysFocus,
    generateSchedule 
  } = useContests()
  const { calculateAvailableHours } = useProfile()
  const [showAddModal, setShowAddModal] = useState(false)

  const upcomingContests = getUpcomingContests()
  const urgentContests = getUrgentContests(14)
  const todaysFocus = getTodaysFocus()
  const hasContests = contests.length > 0

  // 전체 공모전 상위 3개 (준비도 높은 순, 없으면 최근 추가 순)
  const topContests = useMemo(() => {
    return [...allContests]
      .sort((a, b) => {
        const scoreA = a.analysis?.scores?.readiness?.score ?? 0
        const scoreB = b.analysis?.scores?.readiness?.score ?? 0
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
      })
      .slice(0, 3)
  }, [allContests])

  const handleContestAdded = (contestId) => {
    navigate(`/contests?id=${contestId}`)
  }

  const handleQuickSchedule = (contestId, deadline) => {
    const availableHours = calculateAvailableHours(
      new Date().toISOString(),
      deadline
    )
    generateSchedule(contestId, availableHours)
  }

  // Format days left
  const getDaysLeft = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    if (days < 0) return { text: '마감됨', urgent: true }
    if (days === 0) return { text: '오늘 마감', urgent: true }
    if (days === 1) return { text: '내일 마감', urgent: true }
    if (days <= 7) return { text: `D-${days}`, urgent: true }
    return { text: `D-${days}`, urgent: false }
  }

  return (
    <div className="page dashboard">
      {/* Hero Section - 핵심 CTA */}
      <section className="dashboard-hero animate-fade-in-up">
        <div className="hero-content">
          <div className="hero-greeting">
            <h1>
              {profile.basic.name ? `${profile.basic.name}님,` : '안녕하세요!'}
            </h1>
            <p className="hero-subtitle">
              {hasContests 
                ? `${urgentContests.length}개의 공모전이 곧 마감됩니다`
                : '첫 공모전을 분석하고 일정을 만들어보세요'}
            </p>
          </div>
          <div className="hero-actions">
            <button 
              className="btn btn-primary btn-lg hero-btn"
              onClick={() => navigate('/analyze')}
            >
              <span className="btn-content">
                <span className="btn-title">포스터 AI 분석</span>
                <span className="btn-desc">이미지만 올리면 자동 분석</span>
              </span>
            </button>
            <button 
              className="btn btn-secondary btn-lg hero-btn"
              onClick={() => setShowAddModal(true)}
            >
              <span className="btn-content">
                <span className="btn-title">직접 추가</span>
                <span className="btn-desc">정보를 직접 입력</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 프로필 미완성 안내 */}
      {!isProfileComplete() && (
        <div className="profile-prompt animate-fade-in-up animate-delay-1">
          <div className="prompt-content">
            <span className="prompt-icon">💡</span>
            <div className="prompt-text">
              <strong>프로필을 완성하면 맞춤 추천을 받을 수 있어요</strong>
              <p>관심 분야와 기술 스택을 입력해보세요</p>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/profile')}
          >
            프로필 설정
          </button>
        </div>
      )}

      {/* 메인 컨텐츠 */}
      {hasContests ? (
        <div className="dashboard-grid animate-fade-in-up animate-delay-2">
          {/* 왼쪽: 오늘의 집중 + 진행중인 공모전 */}
          <div className="dashboard-main">
            {/* 오늘의 집중 - 가장 중요! */}
            {todaysFocus.length > 0 ? (
              <div className="today-focus-card">
                <div className="focus-header">
                  <h2>오늘의 집중</h2>
                  <span className="focus-date">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}</span>
                </div>
                <div className="focus-main">
                  {todaysFocus.slice(0, 1).map(item => (
                    <div 
                      key={item.contestId} 
                      className={`focus-item-main ${item.isBehind ? 'behind' : ''}`}
                      onClick={() => navigate(`/contests?id=${item.contestId}`)}
                    >
                      <div className="focus-phase-badge">
                        <span className="phase-icon">{item.phase.icon}</span>
                        <span className="phase-label">{item.phase.label}</span>
                      </div>
                      <h3 className="focus-title">{item.contestTitle}</h3>
                      <div className="focus-meta">
                        <span className={`focus-days ${item.urgency}`}>D-{item.daysLeft}</span>
                        <span className="focus-hours">오늘 {item.suggestedHoursToday}시간 권장</span>
                      </div>
                      {item.isBehind && (
                        <p className="focus-warning">⚠ 일정보다 조금 뒤처졌어요. 오늘 집중하면 따라잡을 수 있어요!</p>
                      )}
                    </div>
                  ))}
                </div>
                {todaysFocus.length > 1 && (
                  <div className="focus-others">
                    <span className="focus-others-label">다른 진행 중</span>
                    {todaysFocus.slice(1, 3).map(item => (
                      <div 
                        key={item.contestId} 
                        className="focus-item-mini"
                        onClick={() => navigate(`/contests?id=${item.contestId}`)}
                      >
                        <span>{item.phase.icon}</span>
                        <span>{item.contestTitle}</span>
                        <span className="mini-days">D-{item.daysLeft}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="today-focus-empty">
                <div className="empty-icon">—</div>
                <h3>일정을 생성해보세요</h3>
                <p>공모전에 일정을 추가하면<br/>오늘 할 일을 알려드려요</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/schedule')}
                >
                  일정 관리 보기
                </button>
              </div>
            )}

            {/* 마감 임박 공모전 */}
            {urgentContests.length > 0 && (
              <div className="urgent-section">
                <div className="section-header">
                  <h2>마감 임박</h2>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/contests')}
                  >
                    전체 보기 →
                  </button>
                </div>
                <div className="urgent-list">
                  {urgentContests.slice(0, 4).map(contest => {
                    const daysInfo = getDaysLeft(contest.info.deadline)
                    return (
                      <div 
                        key={contest.id} 
                        className="urgent-item"
                        onClick={() => navigate(`/contests?id=${contest.id}`)}
                      >
                        <div className="urgent-info">
                          <h4>{contest.info.title}</h4>
                          <span className="urgent-category">{contest.info.category}</span>
                        </div>
                        <div className="urgent-meta">
                          <span className={`urgent-days ${daysInfo.urgent ? 'red' : ''}`}>
                            {daysInfo.text}
                          </span>
                          {!contest.schedule && (
                            <button 
                              className="btn btn-secondary btn-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickSchedule(contest.id, contest.info.deadline)
                              }}
                            >
                              일정 생성
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 통계 + 추천 */}
          <div className="dashboard-sidebar">
            {/* 간단한 통계 */}
            <div className="stats-card">
              <h3>현황</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-number">{contests.length}</span>
                  <span className="stat-label">전체 공모전</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{contests.filter(c => c.schedule).length}</span>
                  <span className="stat-label">일정 생성됨</span>
                </div>
                <div className="stat-item accent">
                  <span className="stat-number">{urgentContests.length}</span>
                  <span className="stat-label">마감 임박</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{profile.availability.hoursPerWeek}h</span>
                  <span className="stat-label">주당 가용</span>
                </div>
              </div>
            </div>

            {/* 전체 공모전 미리보기 */}
            {topContests.length > 0 && (
              <div className="recommendations-preview">
                <div className="section-header">
                  <h3>전체 공모전</h3>
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate('/recommendations')}
                  >
                    더보기 →
                  </button>
                </div>
                <div className="recommendation-list">
                  {topContests.slice(0, 2).map(contest => (
                    <div 
                      key={contest.id} 
                      className="recommendation-item"
                      onClick={() => {
                        if (contest.saved && contest.savedContestId) {
                          navigate(`/contests?id=${contest.savedContestId}`)
                        } else {
                          navigate('/recommendations')
                        }
                      }}
                    >
                      <div className="rec-score">
                        {(contest.analysis?.scores?.readiness?.score ?? 0)}%
                      </div>
                      <div className="rec-info">
                        <h4>{contest.info?.title || '제목 없음'}</h4>
                        <span>{contest.info?.organizer || ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* 빈 상태 - 첫 사용자 온보딩 */
        <div className="dashboard-empty animate-fade-in-up animate-delay-2">
          <div className="empty-hero">
            <div className="empty-illustration">
              <span className="empty-icon">—</span>
            </div>
            <h2>공모전 준비, 이제 체계적으로!</h2>
            <p>
              AI가 포스터를 분석하고, 일정을 자동 생성하고,<br/>
              오늘 뭘 해야 하는지 알려드려요.
            </p>
          </div>

          <div className="onboarding-steps">
            <div className="step-card" onClick={() => navigate('/analyze')}>
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>포스터 분석</h3>
                <p>공모전 포스터를 올리면 AI가 핵심 정보를 추출해요</p>
              </div>
              <span className="step-arrow">→</span>
            </div>
            <div className="step-card" onClick={() => navigate('/schedule')}>
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>일정 생성</h3>
                <p>마감일과 가용 시간을 고려한 현실적인 일정</p>
              </div>
              <span className="step-arrow">→</span>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>오늘의 집중</h3>
                <p>매일 뭘 해야 하는지 명확하게 안내받기</p>
              </div>
              <span className="step-check">✓</span>
            </div>
          </div>

          <div className="empty-cta">
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/analyze')}
            >
              첫 공모전 분석하기 →
            </button>
            <button 
              className="btn btn-ghost"
              onClick={() => setShowAddModal(true)}
            >
              또는 직접 추가하기
            </button>
          </div>
        </div>
      )}

      <AddContestModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onAdded={handleContestAdded}
      />
    </div>
  )
}

export default DashboardPage
