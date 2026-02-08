import { useState, useRef, useEffect } from 'react'
import { useContests } from '../../contexts/ContestsContext'
import { useProfile } from '../../contexts/ProfileContext'
import './ChatAssistant.css'

// Simple rule-based responses (can be replaced with GPT API later)
const getAssistantResponse = (message, context) => {
  const lowerMessage = message.toLowerCase()
  
  // Schedule-related questions
  if (lowerMessage.includes('일정') || lowerMessage.includes('스케줄') || lowerMessage.includes('계획')) {
    if (context.todaysFocus.length > 0) {
      const focus = context.todaysFocus[0]
      return `오늘은 "${focus.contestTitle}"의 ${focus.phase.label} 단계에 집중하시면 좋겠어요. D-${focus.daysLeft}이니 ${focus.suggestedHoursToday}시간 정도 투자해보세요.`
    }
    return '현재 진행 중인 일정이 없어요. 공모전을 추가하고 일정을 생성해보세요!'
  }
  
  // Deadline questions
  if (lowerMessage.includes('마감') || lowerMessage.includes('언제')) {
    if (context.urgentContests.length > 0) {
      const urgent = context.urgentContests[0]
      const days = Math.ceil((new Date(urgent.info.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      return `가장 가까운 마감은 "${urgent.info.title}"로 ${days}일 남았어요.`
    }
    return '현재 임박한 마감이 없어요.'
  }
  
  // What to do questions
  if (lowerMessage.includes('뭐') || lowerMessage.includes('해야') || lowerMessage.includes('할 일')) {
    if (context.todaysFocus.length > 0) {
      const focus = context.todaysFocus[0]
      return `지금은 "${focus.contestTitle}"의 ${focus.phase.label} 단계를 진행하세요. ${focus.phase.icon}`
    }
    return '할 일 목록이 비어있어요. 먼저 공모전을 분석하고 일정을 생성해보세요.'
  }
  
  // Time/availability questions
  if (lowerMessage.includes('시간') || lowerMessage.includes('가용')) {
    return `현재 설정된 주당 가용 시간은 ${context.hoursPerWeek}시간이에요. 프로필에서 변경할 수 있어요.`
  }
  
  // Contest questions
  if (lowerMessage.includes('공모전') || lowerMessage.includes('대회')) {
    return `현재 ${context.totalContests}개의 공모전을 관리하고 있어요. ${context.urgentContests.length}개가 마감 임박 상태예요.`
  }
  
  // Help
  if (lowerMessage.includes('도움') || lowerMessage.includes('help') || lowerMessage.includes('?')) {
    return '다음과 같은 질문을 해보세요:\n• "오늘 뭐 해야 해?"\n• "마감이 언제야?"\n• "일정 어떻게 돼?"\n• "시간이 얼마나 있어?"'
  }
  
  // Default
  return '무엇이든 물어보세요! 일정, 마감일, 오늘 할 일 등에 대해 도움드릴 수 있어요.'
}

function ChatAssistant({ isOpen, onToggle }) {
  const { contests, getTodaysFocus, getUrgentContests } = useContests()
  const { profile } = useProfile()
  
  const [messages, setMessages] = useState([
    { id: 1, type: 'assistant', text: '안녕하세요! 공모전 준비에 대해 궁금한 점이 있으면 물어보세요 😊' }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage = { id: Date.now(), type: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Simulate thinking delay
    setTimeout(() => {
      const context = {
        todaysFocus: getTodaysFocus(),
        urgentContests: getUrgentContests(14),
        totalContests: contests.length,
        hoursPerWeek: profile.availability.hoursPerWeek
      }
      
      const response = getAssistantResponse(userMessage.text, context)
      setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', text: response }])
      setIsTyping(false)
    }, 600)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    '오늘 뭐 해야 해?',
    '마감이 언제야?',
    '일정 어떻게 돼?'
  ]

  const handleQuickQuestion = (question) => {
    setInput(question)
    setTimeout(() => handleSend(), 100)
  }

  if (!isOpen) {
    return (
      <button className="chat-toggle-btn" onClick={onToggle}>
        <span>💬</span>
        <span className="toggle-label">도움이 필요하세요?</span>
      </button>
    )
  }

  return (
    <div className="chat-assistant animate-slide-in-right">
      <div className="chat-header">
        <div className="chat-title">
          <span>🤖</span>
          <span>AI 어시스턴트</span>
        </div>
        <button className="chat-close" onClick={onToggle}>×</button>
      </div>

      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            {msg.type === 'assistant' && <span className="message-avatar">🤖</span>}
            <div className="message-content">
              {msg.text.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-message assistant typing">
            <span className="message-avatar">🤖</span>
            <div className="message-content">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && (
        <div className="quick-questions">
          {quickQuestions.map((q, i) => (
            <button 
              key={i} 
              className="quick-btn"
              onClick={() => handleQuickQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="질문을 입력하세요..."
        />
        <button 
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          →
        </button>
      </div>
    </div>
  )
}

export default ChatAssistant
