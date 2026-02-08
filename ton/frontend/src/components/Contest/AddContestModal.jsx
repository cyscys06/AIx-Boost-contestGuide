import { useState } from 'react'
import { useContests } from '../../contexts/ContestsContext'
import './AddContestModal.css'

const CATEGORIES = [
  { value: 'AI/ML', label: 'AI/머신러닝', icon: '' },
  { value: '개발', label: '개발/프로그래밍', icon: '' },
  { value: '디자인', label: '디자인/UX', icon: '' },
  { value: '창업/비즈니스', label: '창업/비즈니스', icon: '' },
  { value: '데이터', label: '데이터 분석', icon: '' },
  { value: '콘텐츠', label: '콘텐츠/미디어', icon: '' },
  { value: '일반', label: '기타', icon: '' }
]

function AddContestModal({ isOpen, onClose, onAdded }) {
  const { addContest } = useContests()
  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    category: '',
    deadline: '',
    description: '',
    link: '',
    tags: ''
  })
  const [errors, setErrors] = useState({})

  if (!isOpen) return null

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = '공모전 이름을 입력해주세요'
    if (!formData.deadline) newErrors.deadline = '마감일을 선택해주세요'
    if (!formData.category) newErrors.category = '분야를 선택해주세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    const contestId = addContest({
      info: {
        title: formData.title.trim(),
        organizer: formData.organizer.trim() || null,
        category: formData.category,
        deadline: formData.deadline,
        description: formData.description.trim() || null,
        link: formData.link.trim() || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isManuallyAdded: true
      },
      analysis: null, // Will be analyzed later if user wants
      userProgress: {
        checklist: [],
        priority: 'medium'
      }
    })

    // Reset form
    setFormData({
      title: '',
      organizer: '',
      category: '',
      deadline: '',
      description: '',
      link: '',
      tags: ''
    })
    setErrors({})
    
    if (onAdded) onAdded(contestId)
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Calculate min date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container add-contest-modal">
        <div className="modal-header">
          <h2>공모전 추가</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              공모전 이름 <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="예: 2026 AI 아이디어 공모전"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Organizer */}
          <div className="form-group">
            <label className="form-label">주최 기관</label>
            <input
              type="text"
              className="form-input"
              placeholder="예: 과학기술정보통신부"
              value={formData.organizer}
              onChange={(e) => handleChange('organizer', e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">
              분야 <span className="required">*</span>
            </label>
            <div className="category-grid">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className={`category-btn ${formData.category === cat.value ? 'active' : ''}`}
                  onClick={() => handleChange('category', cat.value)}
                >
                  {cat.icon && <span className="category-icon">{cat.icon}</span>}
                  <span className="category-label">{cat.label}</span>
                </button>
              ))}
            </div>
            {errors.category && <span className="form-error">{errors.category}</span>}
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label className="form-label">
              마감일 <span className="required">*</span>
            </label>
            <input
              type="date"
              className={`form-input ${errors.deadline ? 'error' : ''}`}
              value={formData.deadline}
              min={today}
              onChange={(e) => handleChange('deadline', e.target.value)}
            />
            {errors.deadline && <span className="form-error">{errors.deadline}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">간단한 설명</label>
            <textarea
              className="form-textarea"
              placeholder="공모전에 대한 간단한 설명 (선택사항)"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Link */}
          <div className="form-group">
            <label className="form-label">공모전 링크</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://..."
              value={formData.link}
              onChange={(e) => handleChange('link', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">태그</label>
            <input
              type="text"
              className="form-input"
              placeholder="쉼표로 구분 (예: Python, 웹개발, 팀프로젝트)"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
            />
            <p className="form-hint">관련 키워드를 입력하면 검색과 필터링에 도움이 됩니다.</p>
          </div>
        </form>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
            추가하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddContestModal
