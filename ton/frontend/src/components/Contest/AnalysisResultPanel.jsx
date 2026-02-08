import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContests } from '../../contexts/ContestsContext'
import { useProfile } from '../../contexts/ProfileContext'
import { createThumbnail } from '../../utils/imageUtils'
import ContestAnalysisContent from './ContestAnalysisContent'
import './AnalysisResultPanel.css'

function AnalysisResultPanel({ result, imagePreview, onSave, onReset }) {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)
  const [savedContestId, setSavedContestId] = useState(null)
  const [allContestId, setAllContestId] = useState(null)
  const hasAddedRef = useRef(false)
  const { addContest, addToAllContests, generateSchedule } = useContests()
  const { calculateAvailableHours } = useProfile()
  
  const { contestInfo, analysis, alternatives } = result?.data || {}

  // Add to allContests when analysis result is first shown (before save)
  useEffect(() => {
    if (!result || !contestInfo || savedContestId) return
    if (hasAddedRef.current) return
    hasAddedRef.current = true
    const contestData = {
      info: { ...contestInfo },
      analysis: {
        analyzedAt: new Date().toISOString(),
        scores: analysis?.scores,
        recommendation: analysis?.recommendation,
        strengths: analysis?.strengths,
        concerns: analysis?.concerns,
        strategicVerdict: analysis?.strategicVerdict,
        estimatedHours: analysis?.scenario?.totalHours || 40,
        hiddenExpectations: analysis?.hiddenExpectations,
        opportunities: analysis?.opportunities,
        warnings: analysis?.warnings,
        dealBreakers: analysis?.dealBreakers,
        scenario: analysis?.scenario
      },
      userProgress: {
        checklist: analysis?.checklist?.map((item, idx) => ({
          id: idx + 1,
          text: item.text,
          done: false
        })) || [],
        priority: analysis?.scores?.readiness?.score >= 70 ? 'high' : 'medium'
      }
    }
    const id = addToAllContests(contestData, { saved: false })
    setAllContestId(id)
  }, [result, savedContestId])

  const handleCancel = () => {
    onReset()
  }

  if (!result) return null
  const verdict = analysis?.strategicVerdict

  // Check if this is a mismatch case
  const isMismatch = verdict?.fitType === 'mismatch'

  const buildContestData = async () => {
    const thumbnail = imagePreview ? await createThumbnail(imagePreview) : null
    return {
      info: {
        ...contestInfo,
        thumbnail
      },
      analysis: {
        analyzedAt: new Date().toISOString(),
        scores: analysis?.scores,
        recommendation: analysis?.recommendation,
        strengths: analysis?.strengths,
        concerns: analysis?.concerns,
        strategicVerdict: verdict,
        estimatedHours: analysis?.scenario?.totalHours || 40,
        hiddenExpectations: analysis?.hiddenExpectations,
        opportunities: analysis?.opportunities,
        warnings: analysis?.warnings,
        dealBreakers: analysis?.dealBreakers,
        scenario: analysis?.scenario
      },
      userProgress: {
        checklist: analysis?.checklist?.map((item, idx) => ({
          id: idx + 1,
          text: item.text,
          done: false
        })) || [],
        priority: analysis?.scores?.readiness?.score >= 70 ? 'high' : 'medium'
      }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const contestData = await buildContestData()
      const contestId = addContest(contestData, allContestId ? { allContestId } : {})
      setSavedContestId(contestId)
      if (onSave) onSave(contestId)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndSchedule = async () => {
    setIsSaving(true)
    try {
      const contestData = await buildContestData()
      const contestId = addContest(contestData, allContestId ? { allContestId } : {})

      // Generate schedule automatically
      if (contestInfo?.deadline) {
        const availableHours = calculateAvailableHours(
          new Date().toISOString(),
          contestInfo.deadline
        )
        generateSchedule(contestId, availableHours)
      }

      // Navigate to schedule page
      navigate(`/contests?id=${contestId}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Show warning panel for mismatch cases
  if (isMismatch && !showFullAnalysis) {
    return (
      <div className="analysis-result animate-fade-in">
        <div className="warning-panel">
          <div className="warning-panel-header">
            <span className="warning-panel-icon">⚠</span>
            <h2 className="warning-panel-title">AI 참가 경고</h2>
          </div>
          <div className="warning-panel-content">
            <p>이 공모전 참가를 <strong>권장하지 않습니다.</strong></p>
            
            {analysis?.dealBreakers?.length > 0 && (
              <>
                <h4 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                  결정적 문제점:
                </h4>
                <ul className="warning-panel-list">
                  {analysis.dealBreakers.map((item, idx) => (
                    <li key={idx}>{item.reason}</li>
                  ))}
                </ul>
              </>
            )}

            {analysis?.scenario && !analysis.scenario.feasible && (
              <div style={{ 
                background: 'rgba(255,255,255,0.5)', 
                padding: 'var(--space-3)', 
                borderRadius: 'var(--radius-md)',
                marginTop: 'var(--space-3)',
                fontSize: 'var(--font-size-sm)'
              }}>
                <strong>예상 결과:</strong><br/>
                필요 시간 {analysis.scenario.totalHours}시간 / 가용 시간 주 {analysis.scenario.userWeeklyHours}시간<br/>
                → {analysis.scenario.conclusion}
              </div>
            )}

            {alternatives?.length > 0 && (
              <>
                <h4 style={{ marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                  💡 대신 권장:
                </h4>
                <ul style={{ margin: 'var(--space-2) 0', paddingLeft: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
                  {alternatives.map((alt, idx) => (
                    <li key={idx} style={{ marginBottom: 'var(--space-1)' }}>
                      <strong>{alt.title}</strong> - {alt.reason}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="warning-panel-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowFullAnalysis(true)}
            >
              그래도 상세 분석 보기
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleCancel}
            >
              취소
            </button>
          </div>
        </div>
      </div>
    )
  }

  // After save - show next step options
  if (savedContestId) {
    return (
      <div className="analysis-result animate-fade-in">
        <div className="save-success-panel">
          <div className="success-icon">✓</div>
          <h2>공모전이 추가되었습니다!</h2>
          <p>"{contestInfo?.title}" 공모전이 내 목록에 저장되었어요.</p>
          
          <div className="next-step-options">
            <button 
              className="btn btn-primary btn-lg next-step-btn"
              onClick={() => {
                if (contestInfo?.deadline) {
                  const availableHours = calculateAvailableHours(
                    new Date().toISOString(),
                    contestInfo.deadline
                  )
                  generateSchedule(savedContestId, availableHours)
                }
                navigate(`/contests?id=${savedContestId}`)
              }}
            >
              <span className="btn-content">
                <span className="btn-title">일정 생성하고 관리하기</span>
                <span className="btn-desc">AI가 준비 일정을 자동 생성해요</span>
              </span>
            </button>
            <button 
              className="btn btn-secondary btn-lg next-step-btn"
              onClick={onReset}
            >
              <span className="btn-content">
                <span className="btn-title">다른 공모전 분석</span>
                <span className="btn-desc">새 포스터 분석 시작</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ContestAnalysisContent
      contestInfo={contestInfo}
      analysis={analysis}
      showFullHeader={true}
      showActions={true}
      renderActions={() => (
        <>
          <button
            className="btn btn-primary btn-lg action-btn-main"
            onClick={handleSaveAndSchedule}
            disabled={isSaving}
          >
            <span className="btn-content">
              <span className="btn-title">{isSaving ? '저장 중...' : '저장하고 일정 생성'}</span>
              <span className="btn-desc">공모전을 추가하고 바로 일정을 만들어요</span>
            </span>
          </button>
          <div className="action-btn-secondary-group">
            <button
              className="btn btn-secondary"
              onClick={handleSave}
              disabled={isSaving}
            >
              저장만 하기
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleCancel}
            >
              취소
            </button>
          </div>
        </>
      )}
    />
  )
}

export default AnalysisResultPanel
