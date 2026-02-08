/**
 * Shared analysis content display - used in both AnalysisResultPanel and MyContestsPage
 * Renders AI analysis result in identical layout
 */
import { useState } from 'react'
import ScoreCard from './ScoreCard'
import './AnalysisResultPanel.css'

function ContestAnalysisContent({ contestInfo, analysis, showFullHeader = true, showActions = false, renderActions }) {
  const [scenarioExpanded, setScenarioExpanded] = useState(false)
  const verdict = analysis?.strategicVerdict

  const getVerdictLabel = (fitType) => {
    switch (fitType) {
      case 'opportunity': return '참가 권장'
      case 'risky': return '주의 필요'
      case 'mismatch': return '참가 비권장'
      default: return '분석 완료'
    }
  }

  const getScoreLevel = (score) => {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'low'
  }

  if (!analysis) return null

  return (
    <div className="analysis-result animate-fade-in">
      {/* Verdict Badge + Title (optional full header) */}
      <div className="analysis-result-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: showFullHeader ? 'var(--space-3)' : 'var(--space-2)' }}>
          {verdict && (
            <span className={`verdict-badge ${verdict.fitType}`}>
              {verdict.fitType === 'opportunity' && '✓'}
              {verdict.fitType === 'risky' && '⚠'}
              {verdict.fitType === 'mismatch' && '✕'}
              {getVerdictLabel(verdict.fitType)}
            </span>
          )}
          {contestInfo?.category && (
            <span className="badge badge-neutral">{contestInfo.category}</span>
          )}
        </div>

        {showFullHeader && (
          <>
            <h2 className="analysis-result-title">
              {contestInfo?.title || '분석 결과'}
            </h2>
            {contestInfo?.organizer && (
              <p className="analysis-result-organizer">{contestInfo.organizer}</p>
            )}
            {contestInfo?.deadline && (
              <span className="analysis-result-deadline">
                마감: {new Date(contestInfo.deadline).toLocaleDateString('ko-KR')}
              </span>
            )}
          </>
        )}
      </div>

      {/* Strategic Summary */}
      {verdict?.summary && (
        <div className="analysis-recommendation">
          <h3>AI 전략 분석</h3>
          <blockquote className="analysis-recommendation-text">
            {verdict.summary}
          </blockquote>
        </div>
      )}

      {/* Key Metrics */}
      {analysis?.scores && (
        <div className="key-metrics">
          <div className="key-metric">
            <div className={`key-metric-value ${getScoreLevel(analysis.scores.skillMatch?.score || 0)}`}>
              {analysis.scores.skillMatch?.score || 0}%
            </div>
            <div className="key-metric-label">전략적 적합도</div>
            <div className="key-metric-desc">{analysis.scores.skillMatch?.label}</div>
          </div>
          <div className="key-metric">
            <div className={`key-metric-value ${getScoreLevel(100 - (analysis.scores.schedulePressure?.score || 50))}`}>
              {analysis.scores.schedulePressure?.label || '보통'}
            </div>
            <div className="key-metric-label">리스크 수준</div>
            <div className="key-metric-desc">일정 압박 {analysis.scores.schedulePressure?.score}%</div>
          </div>
          <div className="key-metric">
            <div className="key-metric-value" style={{ color: 'var(--color-text-primary)' }}>
              {analysis.scenario?.totalHours || '?'}h
            </div>
            <div className="key-metric-label">예상 투자 시간</div>
            <div className="key-metric-desc">{analysis.scenario?.weeksNeeded || '?'}주 집중</div>
          </div>
        </div>
      )}

      {/* Hidden Expectations */}
      {analysis?.hiddenExpectations?.length > 0 && (
        <div className="hidden-expectations">
          <h4 className="hidden-expectations-title">
            ⚠ 숨겨진 기대사항
          </h4>
          <ul className="hidden-expectations-list">
            {analysis.hiddenExpectations.map((exp, idx) => (
              <li key={idx}>
                {exp.insight}
                {exp.source === 'inferred' && (
                  <span className="expectation-source"> [추론]</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opportunities vs Warnings */}
      <div className="analysis-details">
        {analysis?.opportunities?.length > 0 && (
          <div className="analysis-section">
            <h4>기회 요소</h4>
            <ul className="analysis-list">
              {analysis.opportunities.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {analysis?.warnings?.length > 0 && (
          <div className="analysis-section">
            <h4>⚠ 경고</h4>
            <ul className="analysis-list">
              {analysis.warnings.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Scenario Timeline */}
      {analysis?.scenario && (
        <div className="scenario-timeline">
          <div
            className="scenario-timeline-header"
            onClick={() => setScenarioExpanded(!scenarioExpanded)}
          >
            <span className="scenario-timeline-title">
              참가 시나리오 시뮬레이션
            </span>
            <span className="scenario-timeline-toggle">
              {scenarioExpanded ? '접기 ▲' : '펼치기 ▼'}
            </span>
          </div>

          <div className={`scenario-timeline-content ${scenarioExpanded ? '' : 'collapsed'}`}>
            {analysis.scenario.weeks?.map((week, idx) => (
              <div key={idx} className="scenario-week">
                <div className={`scenario-week-marker risk-${week.riskLevel}`} />
                <div className="scenario-week-title">{week.week}</div>
                <div className="scenario-week-tasks">
                  {week.tasks.join(', ')}
                </div>
                <div className="scenario-week-meta">
                  <span>{week.hours}시간</span>
                  {week.riskNote && (
                    <span className="scenario-week-risk">⚠ {week.riskNote}</span>
                  )}
                </div>
              </div>
            ))}

            <div className="scenario-summary">
              <div className="scenario-summary-row">
                <span className="scenario-summary-label">예상 총 시간</span>
                <span className="scenario-summary-value">{analysis.scenario.totalHours}시간</span>
              </div>
              <div className="scenario-summary-row">
                <span className="scenario-summary-label">필요 주수</span>
                <span className="scenario-summary-value">{analysis.scenario.weeksNeeded}주</span>
              </div>
              <div className="scenario-summary-row">
                <span className="scenario-summary-label">주간 가용 시간</span>
                <span className="scenario-summary-value">{analysis.scenario.userWeeklyHours}시간</span>
              </div>
              <div className={`scenario-conclusion ${!analysis.scenario.feasible ? 'warning' : ''}`}>
                {analysis.scenario.conclusion}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Scores (collapsed) */}
      {analysis?.scores && (
        <details className="analysis-scores" style={{ marginTop: 'var(--space-6)' }}>
          <summary>상세 점수 보기</summary>
          <div className="analysis-scores-grid">
            <ScoreCard
              title="기술 적합도"
              icon=""
              score={analysis.scores.skillMatch?.score}
              label={analysis.scores.skillMatch?.label}
              reason={analysis.scores.skillMatch?.reason}
            />
            <ScoreCard
              title="난이도"
              icon=""
              score={analysis.scores.difficulty?.score}
              label={analysis.scores.difficulty?.label}
              reason={analysis.scores.difficulty?.reason}
              inverted
            />
            <ScoreCard
              title="일정 압박"
              icon=""
              score={analysis.scores.schedulePressure?.score}
              label={analysis.scores.schedulePressure?.label}
              reason={analysis.scores.schedulePressure?.reason}
              inverted
            />
            <ScoreCard
              title="참가 형태"
              icon=""
              score={analysis.scores.teamFit?.score}
              label={analysis.scores.teamFit?.label}
              reason={analysis.scores.teamFit?.reason}
            />
            <ScoreCard
              title="포트폴리오 가치"
              icon=""
              score={analysis.scores.portfolioValue?.score}
              label={analysis.scores.portfolioValue?.label}
              reason={analysis.scores.portfolioValue?.reason}
            />
            <ScoreCard
              title="준비도"
              icon=""
              score={analysis.scores.readiness?.score}
              label={analysis.scores.readiness?.label}
              reason={analysis.scores.readiness?.reason}
            />
          </div>
        </details>
      )}

      {/* Checklist Preview */}
      {analysis?.checklist?.length > 0 && (
        <div className="analysis-checklist">
          <h4>📋 준비 체크리스트</h4>
          <ul className="analysis-checklist-list">
            {analysis.checklist.slice(0, 5).map((item, idx) => (
              <li key={idx} className="analysis-checklist-item">
                <span className="analysis-checklist-checkbox">☐</span>
                <span>{item.text}</span>
                {item.priority === 'high' && (
                  <span className="badge badge-danger">중요</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions - only when renderActions provided */}
      {showActions && renderActions && (
        <div className="analysis-actions-v2">
          {renderActions()}
        </div>
      )}
    </div>
  )
}

export default ContestAnalysisContent
