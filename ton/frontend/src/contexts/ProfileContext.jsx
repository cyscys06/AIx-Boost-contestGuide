import { createContext, useContext, useState, useEffect } from 'react'
import { profileStorage } from '../utils/storage'

const ProfileContext = createContext(null)

const DEFAULT_PROFILE = {
  basic: {
    name: '',
    major: '',
    year: '',
    goal: ''
  },
  skills: {
    technical: [],
    soft: [],
    domains: []
  },
  availability: {
    hoursPerWeek: 10,
    preferredTeamSize: 'any',
    blockedPeriods: [],
    // New fields for schedule planner
    workDays: ['sat', 'sun'],
    focusStyle: 'balanced', // 'short-burst' | 'deep-focus' | 'balanced'
    bufferPreference: 'safe', // 'safe' | 'tight'
    constraints: []
  },
  history: {
    contestsEntered: 0,
    contestsWon: 0,
    preferredTypes: []
  }
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load profile from storage on mount
  useEffect(() => {
    const savedProfile = profileStorage.load()
    if (savedProfile) {
      // Deep merge to preserve new default fields
      setProfile(prev => ({
        ...prev,
        ...savedProfile,
        basic: { ...prev.basic, ...savedProfile.basic },
        skills: { ...prev.skills, ...savedProfile.skills },
        availability: { ...prev.availability, ...savedProfile.availability },
        history: { ...prev.history, ...savedProfile.history }
      }))
    }
    setIsLoaded(true)
  }, [])

  // Save to storage whenever profile changes
  useEffect(() => {
    if (isLoaded) {
      profileStorage.save(profile)
    }
  }, [profile, isLoaded])

  const updateProfile = (updates) => {
    setProfile(prev => ({
      ...prev,
      ...updates
    }))
  }

  const updateBasic = (updates) => {
    setProfile(prev => ({
      ...prev,
      basic: { ...prev.basic, ...updates }
    }))
  }

  const updateSkills = (updates) => {
    setProfile(prev => ({
      ...prev,
      skills: { ...prev.skills, ...updates }
    }))
  }

  const addTechnicalSkill = (skill) => {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        technical: [...prev.skills.technical, { name: skill, level: 3, maxLevel: 5 }]
      }
    }))
  }

  const removeTechnicalSkill = (skillName) => {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        technical: prev.skills.technical.filter(s => s.name !== skillName)
      }
    }))
  }

  const updateSkillLevel = (skillName, level) => {
    setProfile(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        technical: prev.skills.technical.map(s =>
          s.name === skillName ? { ...s, level } : s
        )
      }
    }))
  }

  const updateAvailability = (updates) => {
    setProfile(prev => ({
      ...prev,
      availability: { ...prev.availability, ...updates }
    }))
  }

  // Constraint management for schedule planner
  const addConstraint = (constraint) => {
    const newConstraint = {
      id: `constraint_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...constraint
    }
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        constraints: [...prev.availability.constraints, newConstraint]
      }
    }))
    return newConstraint.id
  }

  const updateConstraint = (constraintId, updates) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        constraints: prev.availability.constraints.map(c =>
          c.id === constraintId ? { ...c, ...updates } : c
        )
      }
    }))
  }

  const removeConstraint = (constraintId) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        constraints: prev.availability.constraints.filter(c => c.id !== constraintId)
      }
    }))
  }

  const getActiveConstraints = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return profile.availability.constraints.filter(c => {
      if (c.type === 'recurring') return true
      if (c.type === 'period') {
        const cStart = new Date(c.startDate)
        const cEnd = new Date(c.endDate)
        return cStart <= end && cEnd >= start
      }
      return false
    })
  }

  // Calculate real available hours considering constraints
  const calculateAvailableHours = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const weeks = days / 7
    
    let baseHours = profile.availability.hoursPerWeek * weeks
    
    // Apply period constraints
    const periodConstraints = profile.availability.constraints.filter(c => c.type === 'period')
    for (const constraint of periodConstraints) {
      const cStart = new Date(constraint.startDate)
      const cEnd = new Date(constraint.endDate)
      
      // Calculate overlap
      const overlapStart = Math.max(start, cStart)
      const overlapEnd = Math.min(end, cEnd)
      
      if (overlapStart < overlapEnd) {
        const overlapDays = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24))
        const normalHoursForPeriod = (overlapDays / 7) * profile.availability.hoursPerWeek
        const reducedHours = (overlapDays / 7) * (constraint.hoursAvailable || 0)
        baseHours -= (normalHoursForPeriod - reducedHours)
      }
    }
    
    return Math.max(0, Math.round(baseHours))
  }

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE)
    profileStorage.clear()
  }

  const isProfileComplete = () => {
    return (
      profile.basic.major &&
      profile.basic.goal
    )
  }

  const value = {
    profile,
    isLoaded,
    updateProfile,
    updateBasic,
    updateSkills,
    addTechnicalSkill,
    removeTechnicalSkill,
    updateSkillLevel,
    updateAvailability,
    addConstraint,
    updateConstraint,
    removeConstraint,
    getActiveConstraints,
    calculateAvailableHours,
    resetProfile,
    isProfileComplete
  }

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider')
  }
  return context
}
