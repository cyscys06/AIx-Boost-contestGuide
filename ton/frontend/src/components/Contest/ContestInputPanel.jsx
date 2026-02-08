import { useState, useRef, useEffect } from 'react'
import './ContestInputPanel.css'

function ContestInputPanel({ onAnalyze, isLoading, prefillData }) {
  const [contestText, setContestText] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  // Handle prefill data from recommendations
  useEffect(() => {
    if (prefillData) {
      const prefillText = [
        prefillData.title && `제목: ${prefillData.title}`,
        prefillData.organizer && `주최: ${prefillData.organizer}`,
        prefillData.category && `분야: ${prefillData.category}`,
        prefillData.deadline && `마감일: ${prefillData.deadline}`,
        prefillData.description && `\n${prefillData.description}`
      ].filter(Boolean).join('\n')
      
      setContestText(prefillText)
    }
  }, [prefillData])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }
      
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert('파일 크기는 20MB 이하여야 합니다.')
        return
      }
      
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!contestText && !image) return
    
    onAnalyze({
      text: contestText,
      image: image
    })
  }

  const canSubmit = (contestText.trim() || image) && !isLoading

  return (
    <div className="contest-input-panel">
      <div className="contest-input-header">
        <h2>공모전 분석</h2>
        <p>포스터를 업로드하거나 공모전 정보를 입력하세요.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Image Upload */}
        <div className="contest-input-section">
          <label className="form-label">포스터 이미지 (선택)</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          {imagePreview ? (
            <div className="image-preview-container">
              <img 
                src={imagePreview} 
                alt="포스터 미리보기" 
                className="image-preview"
              />
              <button 
                type="button" 
                onClick={removeImage}
                className="image-remove-btn"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="image-upload-area" onClick={handleImageClick}>
              <div className="image-upload-icon">+</div>
              <div className="image-upload-text">
                클릭하거나 이미지를 드래그하세요
              </div>
              <div className="image-upload-hint">
                PNG, JPG, WEBP (최대 20MB)
              </div>
            </div>
          )}
        </div>

        <div className="contest-input-divider">
          <span>또는</span>
        </div>

        {/* Text Input */}
        <div className="contest-input-section">
          <label className="form-label" htmlFor="contestText">
            공모전 정보 입력
          </label>
          <textarea
            id="contestText"
            className="form-textarea"
            placeholder="공모전 이름, 주최 기관, 주제, 참가 자격, 마감일, 시상 내역 등을 입력하세요..."
            value={contestText}
            onChange={(e) => setContestText(e.target.value)}
            rows={8}
          />
          <p className="form-hint">
            더 자세한 정보를 입력할수록 정확한 분석이 가능합니다.
          </p>
        </div>

        {/* Submit */}
        <div className="contest-input-actions">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg btn-full"
            disabled={!canSubmit}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                분석 중...
              </>
            ) : (
              '분석하기'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContestInputPanel
