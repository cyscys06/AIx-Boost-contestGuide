import { createContext, useContext, useState, useEffect } from 'react'
import { useContests } from './ContestsContext'
import { useProfile } from './ProfileContext'

const AssistantContext = createContext(null)

export function AssistantProvider({ children }) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [recentAnalysis, setRecentAnalysis] = useState(null)
  
  const { contests, getUrgentContests, getUpcomingContests } = useContests()
  const { profile, isProfileComplete } = useProfile()

  // Check for timeline conflicts
  const checkTimelineConflicts = () => {
    const upcoming = getUpcomingContests()
    const weekMap = {}
    
    upcoming.forEach(c => {
      if (c.info?.deadline) {
        const deadline = new Date(c.info.deadline)
        const weekNum = Math.floor(deadline.getTime() / (7 * 24 * 60 * 60 * 1000))
        weekMap[weekNum] = (weekMap[weekNum] || 0) + 1
      }
    })
    
    return Object.values(weekMap).some(count => count >= 2)
  }

  // Generate contextual message based on current state
  const generateMessage = () => {
    const urgentContests = getUrgentContests(14)
    const upcomingContests = getUpcomingContests()
    const hasTimelineConflict = checkTimelineConflicts()
    
    // NEW: Check if recent analysis was a mismatch
    if (recentAnalysis?.fitType === 'mismatch') {
      return {
        text: '방금 분석한 공모전은 현재 상황에 맞지 않아요. 다른 공모전을 찾아볼까요?',
        type: 'caution',
        action: {
          label: '대안 찾기',
          path: '/analyze'
        }
      }
    }
    
    // NEW: Timeline conflict warning
    if (hasTimelineConflict) {
      return {
        text: '⚠️ 관심 공모전 중 2개 이상의 마감이 같은 주에 있어요. 일정 조정이 필요할 수 있습니다.',
        type: 'warning',
        action: {
          label: '타임라인 확인',
          path: '/timeline'
        }
      }
    }
    
    // Check if profile is incomplete
    if (!isProfileComplete()) {
      return {
        text: '프로필을 완성하면 더 정확한 추천을 받을 수 있어요. 프로필을 설정해볼까요?',
        type: 'suggestion',
        action: {
          label: '프로필 설정하기',
          path: '/profile'
        }
      }
    }
    
    // Check for urgent deadlines
    if (urgentContests.length > 0) {
      const mostUrgent = urgentContests[0]
      const deadline = new Date(mostUrgent.info.deadline)
      const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
      
      return {
        text: `${mostUrgent.info.title} 마감이 ${daysLeft}일 남았어요. 준비 상황을 확인해볼까요?`,
        type: 'warning',
        action: {
          label: '확인하기',
          path: `/contests`
        },
        contestId: mostUrgent.id
      }
    }
    
    // No contests yet
    if (contests.length === 0) {
      return {
        text: '아직 관심 공모전이 없네요. 새로운 공모전을 분석해볼까요?',
        type: 'suggestion',
        action: {
          label: '공모전 분석하기',
          path: '/analyze'
        }
      }
    }
    
    // Default encouraging message
    const messages = [
      '오늘도 공모전 준비 화이팅!',
      '꾸준히 준비하면 좋은 결과가 있을 거예요.',
      '새로운 공모전을 찾아볼까요?'
    ]
    
    return {
      text: messages[Math.floor(Math.random() * messages.length)],
      type: 'encouragement',
      action: {
        label: '새 공모전 분석',
        path: '/analyze'
      }
    }
  }
  
  // NEW: Update assistant based on analysis result
  const onAnalysisComplete = (analysisResult) => {
    const verdict = analysisResult?.data?.analysis?.strategicVerdict
    if (verdict) {
      setRecentAnalysis(verdict)
      
      // Generate immediate response based on verdict
      if (verdict.fitType === 'mismatch') {
        setCurrentMessage({
          text: '이 공모전은 현재 상황에서 적합하지 않아요. 다른 기회를 찾아볼까요?',
          type: 'caution',
          action: {
            label: '다른 공모전 분석',
            path: '/analyze'
          }
        })
      } else if (verdict.fitType === 'opportunity') {
        setCurrentMessage({
          text: '좋은 기회네요! 관심 목록에 추가하고 준비를 시작해보세요.',
          type: 'encouragement',
          action: {
            label: '준비 시작',
            path: '/timeline'
          }
        })
      }
    }
  }

  // Update message when context changes
  useEffect(() => {
    const message = generateMessage()
    setCurrentMessage(message)
  }, [contests.length, profile])

  const toggleMinimized = () => {
    setIsMinimized(prev => !prev)
  }

  const refreshMessage = () => {
    const message = generateMessage()
    setCurrentMessage(message)
  }

  // Get upcoming deadlines for display
  const getDeadlinesList = () => {
    return getUpcomingContests()
      .slice(0, 5)
      .map(c => {
        const deadline = new Date(c.info.deadline)
        const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))
        return {
          id: c.id,
          title: c.info.title,
          daysLeft,
          isUrgent: daysLeft <= 7
        }
      })
  }

  const value = {
    isMinimized,
    currentMessage,
    isLoading,
    toggleMinimized,
    refreshMessage,
    getDeadlinesList,
    setIsMinimized,
    onAnalysisComplete,
    recentAnalysis
  }

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const context = useContext(AssistantContext)
  if (!context) {
    throw new Error('useAssistant must be used within AssistantProvider')
  }
  return context
}
