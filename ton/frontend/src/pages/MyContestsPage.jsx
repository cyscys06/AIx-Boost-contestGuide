import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useContests } from '../contexts/ContestsContext'
import ContestCard from '../components/Contest/ContestCard'
import ScheduleTimeline from '../components/Schedule/ScheduleTimeline'
import ContestAnalysisContent from '../components/Contest/ContestAnalysisContent'
import './MyContestsPage.css'

function MyContestsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { contests, removeContest, toggleChecklistItem, addChecklistItem, updateContestProgress } = useContests()
  
  const [selectedId, setSelectedId] = useState(null)
  const [newChecklistText, setNewChecklistText] = useState('')

  // Set selected contest from URL param
  useEffect(() => {
    const idFromUrl = searchParams.get('id')
    if (idFromUrl) {
      setSelectedId(idFromUrl)
    } else if (contests.length > 0 && !selectedId) {
      setSelectedId(contests[0].id)
    }
  }, [searchParams, contests])

  const selectedContest = contests.find(c => c.id === selectedId)

  const handleSelectContest = (id) => {
    setSelectedId(id)
  }

  const handleDelete = () => {
    if (window.confirm('이 공모전을 관심 목록에서 삭제하시겠습니까?')) {
      removeContest(selectedId)
      setSelectedId(contests.length > 1 ? contests.find(c => c.id !== selectedId)?.id : null)
    }
  }

  const handleAddChecklist = (e) => {
    e.preventDefault()
    if (!newChecklistText.trim()) return
    addChecklistItem(selectedId, newChecklistText.trim())
    setNewChecklistText('')
  }

  const handlePriorityChange = (priority) => {
    updateContestProgress(selectedId, { priority })
  }

  if (contests.length === 0) {
    return (
      <div className="page my-contests-page">
        <div className="empty-page-container animate-fade-in-up">
          <div className="empty-illustration">
            <span className="empty-emoji">—</span>
          </div>
          <h1>아직 관리 중인 공모전이 없어요</h1>
          <p>
            포스터를 분석하거나 직접 추가하면<br/>
            여기서 체계적으로 관리할 수 있어요
          </p>
          <div className="empty-cta-group">
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/analyze')}
            >
              포스터 분석하기
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page my-contests-page">
      <div className="page-header">
        <h1 className="page-title">내 공모전</h1>
        <p className="page-subtitle">관심 있는 공모전을 관리하세요.</p>
      </div>

      <div className="my-contests-layout">
        {/* Contest List */}
        <div className="my-contests-list-section">
          <div className="my-contests-list">
            {contests.map(contest => (
              <div 
                key={contest.id}
                className={`my-contests-list-item ${selectedId === contest.id ? 'selected' : ''}`}
                onClick={() => handleSelectContest(contest.id)}
              >
                <ContestCard contest={contest} compact />
              </div>
            ))}
          </div>
        </div>

        {/* Contest Detail */}
        {selectedContest && (
          <div className="my-contests-detail-section">
            <div className="panel my-contests-detail">
              <div className="my-contests-detail-header">
                <div>
                  <h2>{selectedContest.info?.title || '제목 없음'}</h2>
                  {selectedContest.info?.organizer && (
                    <p className="my-contests-detail-organizer">
                      {selectedContest.info.organizer}
                    </p>
                  )}
                </div>
                <div className="my-contests-detail-actions">
                  <button className="btn btn-danger-outline btn-sm" onClick={handleDelete}>
                    삭제
                  </button>
                </div>
              </div>

              {/* Deadline & Category */}
              <div className="my-contests-detail-meta">
                {selectedContest.info?.deadline && (
                  <span className="my-contests-meta-item">
                    📅 마감: {new Date(selectedContest.info.deadline).toLocaleDateString('ko-KR')}
                  </span>
                )}
                {selectedContest.info?.category && (
                  <span className="badge badge-neutral">{selectedContest.info.category}</span>
                )}
              </div>

              {/* Priority */}
              <div className="my-contests-priority">
                <span className="my-contests-priority-label">우선순위:</span>
                <div className="my-contests-priority-buttons">
                  {['high', 'medium', 'low'].map(p => (
                    <button
                      key={p}
                      className={`my-contests-priority-btn ${selectedContest.userProgress?.priority === p ? 'active' : ''}`}
                      onClick={() => handlePriorityChange(p)}
                    >
                      {p === 'high' ? '높음' : p === 'medium' ? '보통' : '낮음'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divider" />

              {/* Checklist */}
              <div className="my-contests-checklist">
                <h3>준비 체크리스트</h3>
                {selectedContest.userProgress?.checklist?.length > 0 ? (
                  <ul className="my-contests-checklist-list">
                    {selectedContest.userProgress.checklist.map(item => (
                      <li 
                        key={item.id}
                        className={`my-contests-checklist-item ${item.done ? 'done' : ''}`}
                        onClick={() => toggleChecklistItem(selectedId, item.id)}
                      >
                        <span className="my-contests-checkbox">
                          {item.done ? '☑' : '☐'}
                        </span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="my-contests-checklist-empty">
                    체크리스트가 비어있습니다.
                  </p>
                )}

                <form onSubmit={handleAddChecklist} className="my-contests-checklist-form">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="새 항목 추가..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    추가
                  </button>
                </form>
              </div>

              {/* Schedule Timeline */}
              <div className="divider" />
              <ScheduleTimeline contestId={selectedId} />

              {/* Full AI Analysis - same layout as Analysis page */}
              {selectedContest.analysis && (
                <>
                  <div className="divider" />
                  <ContestAnalysisContent
                    contestInfo={selectedContest.info}
                    analysis={selectedContest.analysis}
                    showFullHeader={false}
                    showActions={false}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyContestsPage
