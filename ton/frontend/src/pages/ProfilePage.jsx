import { useState } from 'react'
import { useProfile } from '../contexts/ProfileContext'
import './ProfilePage.css'

function ProfilePage() {
  const { 
    profile, 
    updateBasic, 
    updateAvailability,
    resetProfile
  } = useProfile()

  const [saved, setSaved] = useState(false)

  const handleBasicChange = (e) => {
    const { name, value } = e.target
    updateBasic({ [name]: value })
    setSaved(false)
  }

  const handleAvailabilityChange = (field, value) => {
    updateAvailability({ [field]: value })
    setSaved(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm('프로필을 초기화하시겠습니까? 모든 정보가 삭제됩니다.')) {
      resetProfile()
    }
  }

  return (
    <div className="page profile-page">
      <div className="page-header">
        <h1 className="page-title">프로필</h1>
        <p className="page-subtitle">
          정확한 정보를 입력할수록 더 좋은 추천을 받을 수 있습니다.
        </p>
      </div>

      <div className="profile-sections">
        {/* Basic Info */}
        <section className="profile-section panel">
          <h2>기본 정보</h2>
          
          <div className="profile-form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="name">이름 (선택)</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="홍길동"
                value={profile.basic.name}
                onChange={handleBasicChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="major">전공 / 분야 *</label>
              <input
                type="text"
                id="major"
                name="major"
                className="form-input"
                placeholder="컴퓨터공학, 경영학, 디자인 등"
                value={profile.basic.major}
                onChange={handleBasicChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="year">학년 / 신분</label>
              <select
                id="year"
                name="year"
                className="form-select"
                value={profile.basic.year}
                onChange={handleBasicChange}
              >
                <option value="">선택하세요</option>
                <option value="1학년">1학년</option>
                <option value="2학년">2학년</option>
                <option value="3학년">3학년</option>
                <option value="4학년">4학년</option>
                <option value="대학원생">대학원생</option>
                <option value="직장인">직장인</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="goal">공모전 참가 목표 *</label>
              <input
                type="text"
                id="goal"
                name="goal"
                className="form-input"
                placeholder="예: 포트폴리오 구축, 수상 경력, 취업 준비 등"
                value={profile.basic.goal}
                onChange={handleBasicChange}
              />
            </div>
          </div>
        </section>

        {/* Availability */}
        <section className="profile-section panel">
          <h2>시간 및 선호</h2>

          <div className="form-group">
            <label className="form-label">주당 투자 가능 시간</label>
            <div className="profile-hours-slider">
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={profile.availability.hoursPerWeek}
                onChange={(e) => handleAvailabilityChange('hoursPerWeek', parseInt(e.target.value))}
              />
              <span className="profile-hours-value">
                {profile.availability.hoursPerWeek}시간 / 주
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">선호하는 참가 형태</label>
            <div className="profile-team-options">
              {[
                { value: 'solo', label: '개인 참가' },
                { value: 'small', label: '소규모 팀 (2-3명)' },
                { value: 'large', label: '대규모 팀 (4명+)' },
                { value: 'any', label: '상관 없음' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`profile-team-option ${profile.availability.preferredTeamSize === option.value ? 'active' : ''}`}
                  onClick={() => handleAvailabilityChange('preferredTeamSize', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="profile-actions">
          <button className="btn btn-primary btn-lg" onClick={handleSave}>
            {saved ? '저장됨' : '저장하기'}
          </button>
          <button className="btn btn-ghost" onClick={handleReset}>
            초기화
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
