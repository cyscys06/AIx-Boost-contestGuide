import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useProfile } from '../contexts/ProfileContext'
import { analyzeContest } from '../utils/api'
import AddContestModal from '../components/Contest/AddContestModal'
import AnalysisResultPanel from '../components/Contest/AnalysisResultPanel'
import './AnalyzePage.css'

function AnalyzePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useProfile()
  
  const [mode, setMode] = useState('poster') // 'poster' or 'manual'
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [imageWarning, setImageWarning] = useState(null)
  
  // Image upload state
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [contestText, setContestText] = useState('')
  const [imageInputMode, setImageInputMode] = useState('upload') // 'upload' | 'camera'
  const [cameraError, setCameraError] = useState(null)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Handle prefilled contest data from recommendations page
  useEffect(() => {
    if (location.state?.prefillContest) {
      const prefill = location.state.prefillContest
      setContestText([
        prefill.title && `제목: ${prefill.title}`,
        prefill.organizer && `주최: ${prefill.organizer}`,
        prefill.category && `분야: ${prefill.category}`,
        prefill.deadline && `마감일: ${prefill.deadline}`,
        prefill.description && `\n${prefill.description}`
      ].filter(Boolean).join('\n'))
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  // Loading step animation
  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0)
      return
    }
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep = Math.min(currentStep + 1, 3)
      setLoadingStep(currentStep)
    }, 2500)
    return () => clearInterval(interval)
  }, [isLoading])

  // Drag and drop handlers
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e) => {
      e.preventDefault()
      dropZone.classList.add('drag-over')
    }
    
    const handleDragLeave = () => {
      dropZone.classList.remove('drag-over')
    }
    
    const handleDrop = (e) => {
      e.preventDefault()
      dropZone.classList.remove('drag-over')
      const file = e.dataTransfer.files[0]
      if (file) handleImageFile(file)
    }

    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('drop', handleDrop)
    }
  }, [])

  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드 가능합니다.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB 이하여야 합니다.')
      return
    }
    setImage(file)
    setError(null)
    setImageWarning(null)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) handleImageFile(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    setImageWarning(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 카메라 스트림 시작
  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      setCameraError('카메라에 접근할 수 없습니다. 브라우저 권한을 확인해주세요.')
      console.error('Camera error:', err)
    }
  }

  // 카메라 스트림 정지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // 카메라 촬영
  const captureFromCamera = () => {
    if (!videoRef.current || !streamRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
      setImage(file)
      setImagePreview(URL.createObjectURL(blob))
      setError(null)
      setImageWarning(null)
      stopCamera()
      setImageInputMode('upload')
    }, 'image/jpeg', 0.9)
  }

  // 카메라 모드일 때 스트림 시작, 모드 변경/언마운트 시 정리
  useEffect(() => {
    if (imageInputMode === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [imageInputMode])

  const handleAnalyze = async () => {
    if (!image && !contestText.trim()) return
    
    setIsLoading(true)
    setError(null)
    setImageWarning(null)
    
    try {
      const response = await analyzeContest({
        userProfile: {
          major: profile.basic.major,
          skills: profile.skills.technical.map(s => ({ name: s.name, level: s.level })),
          goal: profile.basic.goal,
          hoursPerWeek: profile.availability.hoursPerWeek,
          preferredTeamSize: profile.availability.preferredTeamSize
        },
        contest: {
          text: contestText,
          image: image
        },
        options: {
          includeAlternatives: true,
          generateChecklist: true
        }
      })
      
      // Check if image validation warning exists in response
      if (response.imageValidation && !response.imageValidation.isValidPoster) {
        setImageWarning({
          type: response.imageValidation.type || 'unclear',
          message: response.imageValidation.message || '이미지에서 공모전 정보를 명확하게 찾지 못했어요.',
          suggestions: response.imageValidation.suggestions || []
        })
        // Still show result but with warning
      }
      
      // Check if analysis result indicates low confidence
      if (response.analysis?.confidence === 'low' && image) {
        setImageWarning({
          type: 'low_confidence',
          message: '이 이미지에서 공모전 정보를 찾기 어려웠어요.',
          suggestions: ['텍스트로 추가 정보를 입력하면 더 정확한 분석이 가능해요.']
        })
      }
      
      setResult(response)
    } catch (err) {
      setError(err.message || '분석 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = (contestId) => {
    navigate(`/contests?id=${contestId}`)
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setImageWarning(null)
    setImage(null)
    setImagePreview(null)
    setContestText('')
  }

  const handleContestAdded = (contestId) => {
    navigate(`/contests?id=${contestId}`)
  }

  const dismissWarning = () => {
    setImageWarning(null)
  }

  const canAnalyze = (image || contestText.trim()) && !isLoading

  // Show result panel if we have results
  if (result) {
    return (
      <div className="page analyze-page">
        {/* Image Warning Banner */}
        {imageWarning && (
          <div className="image-validation-warning">
            <div className="warning-icon">💡</div>
            <div className="warning-content">
              <strong>확인이 필요해요</strong>
              <p>{imageWarning.message}</p>
              {imageWarning.suggestions?.length > 0 && (
                <ul className="warning-suggestions">
                  {imageWarning.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
            <button className="warning-dismiss" onClick={dismissWarning}>×</button>
          </div>
        )}
        <div className="analyze-result-wrapper">
          <AnalysisResultPanel 
            result={result}
            imagePreview={imagePreview}
            onSave={handleSave}
            onReset={handleReset}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page analyze-page">
      {/* Hero Section */}
      <div className="analyze-hero">
        <h1>공모전 분석</h1>
        <p>AI가 공모전 정보를 분석하고 맞춤 전략을 제안합니다</p>
      </div>

      {/* Mode Tabs */}
      <div className="analyze-tabs">
        <button 
          className={`analyze-tab ${mode === 'poster' ? 'active' : ''}`}
          onClick={() => setMode('poster')}
        >
          포스터 분석
        </button>
        <button 
          className={`analyze-tab ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}
        >
          직접 추가
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="analyze-error">
          <span>!</span>
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Poster Analysis Mode */}
      {mode === 'poster' && (
        <div className="analyze-content">
          <div className="analyze-main-card">
            {/* Image Upload / Camera */}
            <div className="upload-section">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {!imagePreview ? (
                <>
                  <div className="image-input-tabs">
                    <button
                      type="button"
                      className={`image-input-tab ${imageInputMode === 'upload' ? 'active' : ''}`}
                      onClick={() => { setImageInputMode('upload'); setCameraError(null) }}
                    >
                      파일 업로드
                    </button>
                    <button
                      type="button"
                      className={`image-input-tab ${imageInputMode === 'camera' ? 'active' : ''}`}
                      onClick={() => { setImageInputMode('camera'); removeImage() }}
                    >
                      카메라 촬영
                    </button>
                  </div>

                  {imageInputMode === 'upload' && (
                    <div
                      ref={dropZoneRef}
                      className="upload-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="dropzone-icon">+</div>
                      <h3>포스터 이미지 업로드</h3>
                      <p>클릭하거나 파일을 드래그하세요</p>
                      <span className="dropzone-hint">PNG, JPG, WEBP (최대 20MB)</span>
                    </div>
                  )}

                  {imageInputMode === 'camera' && (
                    <div className="camera-capture-box">
                      {cameraError ? (
                        <div className="camera-error">
                          <p>{cameraError}</p>
                          <button className="btn btn-secondary btn-sm" onClick={startCamera}>
                            다시 시도
                          </button>
                        </div>
                      ) : (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="camera-preview"
                          />
                          <div className="camera-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => { stopCamera(); setImageInputMode('upload') }}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={captureFromCamera}
                            >
                              촬영
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="image-preview-box">
                  <img src={imagePreview} alt="포스터 미리보기" />
                  <button
                    className="image-remove-btn"
                    onClick={removeImage}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* Image Tips */}
            {imagePreview && (
              <div className="image-tips">
                <span className="tip-icon">💡</span>
                <span>공모전 포스터가 아닌 경우에도 분석을 시도하지만, 정확도가 낮을 수 있어요.</span>
              </div>
            )}

            {/* Optional Text */}
            <div className="optional-text-section">
              <div className="optional-header">
                <span className="optional-badge">선택</span>
                <label>추가 정보 입력</label>
              </div>
              <textarea
                className="form-textarea"
                placeholder="포스터에 없는 추가 정보가 있다면 입력하세요 (선택사항)"
                value={contestText}
                onChange={(e) => setContestText(e.target.value)}
                rows={3}
              />
            </div>

            {/* Analyze Button */}
            <button 
              className="btn btn-primary btn-lg btn-full analyze-btn"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
            >
              {isLoading ? (
                <span className="loading-text">
                  <span className="spinner" />
                  AI 분석 중...
                </span>
              ) : (
                <>
                  AI 분석 시작
                </>
              )}
            </button>
          </div>

          {/* Loading Progress */}
          {isLoading && (
            <div className="loading-progress">
              <div className="loading-steps">
                {[
                  '이미지 분석 중',
                  '공모전 정보 추출',
                  '프로필 매칭 평가',
                  '전략 리포트 생성'
                ].map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`loading-step ${loadingStep >= idx ? 'active' : ''} ${loadingStep > idx ? 'done' : ''}`}
                  >
                    <span className="step-indicator">
                      {loadingStep > idx ? '✓' : loadingStep === idx ? '⋯' : (idx + 1)}
                    </span>
                    <span className="step-text">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Add Mode */}
      {mode === 'manual' && (
        <div className="analyze-content">
          <div className="manual-add-card">
            <div className="manual-add-icon">+</div>
            <h3>공모전 직접 추가</h3>
            <p>
              관심있는 공모전 정보를 직접 입력하여<br/>
              관리하고 분석받을 수 있습니다.
            </p>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => setShowAddModal(true)}
            >
              공모전 추가하기
            </button>
          </div>

          <div className="manual-tips">
            <h4>💡 이런 경우에 유용해요</h4>
            <ul>
              <li>포스터가 없는 공모전을 추가하고 싶을 때</li>
              <li>나중에 참가할 공모전을 미리 저장해두고 싶을 때</li>
              <li>마감일 관리와 체크리스트를 활용하고 싶을 때</li>
            </ul>
          </div>
        </div>
      )}

      {/* Add Contest Modal */}
      <AddContestModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={handleContestAdded}
      />
    </div>
  )
}

export default AnalyzePage
