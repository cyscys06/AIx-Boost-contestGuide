import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { contestsStorage, allContestsStorage } from '../utils/storage'
import { DEFAULT_PHASES, PHASE_STATUS_ORDER, PROGRESS_BEHIND_THRESHOLD } from '../constants/schedule'
import { calculateBufferDays, calculateWorkDays, calculateUrgency } from '../utils/scheduleHelpers'
import { generatePhases, generateWeeklyPlan, createSchedule, extractScheduleParams } from '../utils/scheduleGenerator'
import { TIME_CONSTANTS, DEFAULT_VALUES } from '../constants/schedule'

const ContestsContext = createContext(null)

export function ContestsProvider({ children }) {
  const [contests, setContests] = useState([])
  const [allContests, setAllContests] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load contests from storage on mount
  useEffect(() => {
    const savedContests = contestsStorage.load()
    let loadedContests = []
    if (savedContests && Array.isArray(savedContests)) {
      loadedContests = savedContests
      setContests(savedContests)
    }
    let savedAllContests = allContestsStorage.load()
    if (savedAllContests && Array.isArray(savedAllContests) && savedAllContests.length > 0) {
      setAllContests(savedAllContests)
    } else if (loadedContests.length > 0) {
      // Migration: populate allContests from existing saved contests
      const migrated = loadedContests.map(c => ({
        id: `all_${c.id}`,
        saved: true,
        savedContestId: c.id,
        addedAt: c.addedAt || new Date().toISOString(),
        info: c.info,
        analysis: c.analysis,
        userProgress: c.userProgress
      }))
      setAllContests(migrated)
    }
    setIsLoaded(true)
  }, [])

  // Save to storage whenever contests change
  useEffect(() => {
    if (isLoaded) {
      contestsStorage.save(contests)
    }
  }, [contests, isLoaded])

  useEffect(() => {
    if (isLoaded) {
      allContestsStorage.save(allContests)
    }
  }, [allContests, isLoaded])

  const addContest = (contestData, options = {}) => {
    const { allContestId } = options
    const now = Date.now()
    const newContest = {
      id: `contest_${now}`,
      addedAt: new Date().toISOString(),
      status: 'interested',
      ...contestData,
      userProgress: {
        checklist: [],
        notes: '',
        priority: DEFAULT_VALUES.PRIORITY,
        ...contestData.userProgress
      },
      schedule: contestData.schedule || null,
      progress: contestData.progress || null
    }
    setContests(prev => [newContest, ...prev])

    if (allContestId) {
      setAllContests(prev => prev.map(ac =>
        ac.id === allContestId
          ? { ...ac, saved: true, savedContestId: newContest.id }
          : ac
      ))
    } else {
      setAllContests(prev => [{
        id: `all_${now}`,
        saved: true,
        savedContestId: newContest.id,
        addedAt: new Date().toISOString(),
        info: contestData.info,
        analysis: contestData.analysis,
        userProgress: contestData.userProgress
      }, ...prev])
    }
    return newContest.id
  }

  const addToAllContests = useCallback((contestData, { saved = false } = {}) => {
    const now = Date.now()
    const entry = {
      id: `all_${now}`,
      saved,
      savedContestId: null,
      addedAt: new Date().toISOString(),
      info: contestData.info,
      analysis: contestData.analysis,
      userProgress: contestData.userProgress
    }
    setAllContests(prev => [entry, ...prev])
    return entry.id
  }, [])

  const removeFromAllContests = useCallback((allContestId) => {
    setAllContests(prev => prev.filter(ac => ac.id !== allContestId))
  }, [])

  const updateContest = (contestId, updates) => {
    setContests(prev => prev.map(c =>
      c.id === contestId ? { ...c, ...updates } : c
    ))
  }

  const removeContest = (contestId) => {
    setContests(prev => prev.filter(c => c.id !== contestId))
  }

  const getContestById = (contestId) => {
    // First try to find in contests (saved contests)
    const contest = contests.find(c => c.id === contestId)
    if (contest) return contest
    
    // If not found, try to find in allContests
    const allContest = allContests.find(c => c.id === contestId)
    if (allContest) {
      // If it has a saved version, return the saved version from contests (which has schedule)
      if (allContest.saved && allContest.savedContestId) {
        const savedContest = contests.find(c => c.id === allContest.savedContestId)
        if (savedContest) return savedContest
      }
      // Otherwise return the allContest (for schedule generation)
      return allContest
    }
    
    return null
  }

  const updateContestProgress = (contestId, progressUpdates) => {
    setContests(prev => prev.map(c =>
      c.id === contestId
        ? { ...c, userProgress: { ...c.userProgress, ...progressUpdates } }
        : c
    ))
  }

  const toggleChecklistItem = (contestId, itemId) => {
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c
      return {
        ...c,
        userProgress: {
          ...c.userProgress,
          checklist: c.userProgress.checklist.map(item =>
            item.id === itemId ? { ...item, done: !item.done } : item
          )
        }
      }
    }))
  }

  const addChecklistItem = (contestId, text) => {
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c
      const newItem = {
        id: Date.now(),
        text: text.trim(),
        done: false
      }
      return {
        ...c,
        userProgress: {
          ...c.userProgress,
          checklist: [...c.userProgress.checklist, newItem]
        }
      }
    }))
  }

  // Schedule generation - 분석 결과를 반영한 자연스러운 일정
  const generateSchedule = (contestId, availableHours, userPreferences = {}) => {
    // Find contest in contests or allContests
    let contest = contests.find(c => c.id === contestId)
    let actualContestId = contestId
    
    if (!contest) {
      const allContest = allContests.find(c => c.id === contestId)
      if (allContest) {
        const hasSavedVersion = allContest.saved && allContest.savedContestId
        if (hasSavedVersion) {
          actualContestId = allContest.savedContestId
          contest = contests.find(c => c.id === actualContestId)
        } else {
          // Auto-save to contests when generating schedule
          const contestData = {
            info: allContest.info,
            analysis: allContest.analysis,
            userProgress: allContest.userProgress || {
              checklist: [],
              notes: '',
              priority: DEFAULT_VALUES.PRIORITY
            }
          }
          actualContestId = addContest(contestData, { allContestId: contestId })
          contest = contests.find(c => c.id === actualContestId) || { ...contestData, id: actualContestId }
        }
      }
    } else {
      actualContestId = contest.id
    }
    
    // Validate contest exists and has required data
    if (!contest) {
      console.error('Contest not found:', contestId)
      return null
    }
    
    if (!contest?.info?.deadline) {
      console.error('Contest deadline not found:', contestId)
      return null
    }

    const deadline = new Date(contest.info.deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const daysRemaining = Math.ceil((deadline - today) / TIME_CONSTANTS.MILLISECONDS_PER_DAY)

    if (daysRemaining <= 0) return null

    // Extract schedule parameters
    const { totalEstimatedHours, difficulty, schedulePressure, category } = extractScheduleParams(contest)

    // Calculate buffer and work days
    const bufferDays = calculateBufferDays(schedulePressure)
    const workDays = calculateWorkDays(daysRemaining, bufferDays)

    // Generate phases
    const phases = generatePhases({
      workDays,
      totalEstimatedHours,
      difficulty,
      category,
      schedulePressure,
      startDate: today
    })

    // Generate weekly plan
    const weeklyPlan = generateWeeklyPlan(phases, daysRemaining, totalEstimatedHours)

    // Create schedule object
    const schedule = createSchedule({
      totalEstimatedHours,
      availableHours,
      phases,
      daysRemaining,
      weeklyPlan
    })

    // Update contest with schedule
    updateContest(actualContestId, { schedule })
    
    return schedule
  }

  // 일정 삭제
  const removeSchedule = (contestId) => {
    setContests(prev => prev.map(c =>
      c.id === contestId ? { ...c, schedule: null } : c
    ))
  }

  // Update phase status
  const updatePhaseStatus = (contestId, phaseId, status) => {
    setContests(prev => prev.map(c => {
      if (c.id !== contestId || !c.schedule) return c
      return {
        ...c,
        schedule: {
          ...c.schedule,
          phases: c.schedule.phases.map(p =>
            p.id === phaseId ? { ...p, status } : p
          )
        }
      }
    }))
  }

  // Log daily progress
  const logDailyProgress = (contestId, hoursWorked, notes = '') => {
    setContests(prev => prev.map(c => {
      if (c.id !== contestId) return c
      
      const today = new Date().toISOString().split('T')[0]
      const existingProgress = c.progress || { dailyLogs: [], actualHoursSpent: 0 }
      
      // Check if already logged today
      const existingLog = existingProgress.dailyLogs.find(l => l.date === today)
      let newLogs
      let newTotalHours
      
      if (existingLog) {
        newLogs = existingProgress.dailyLogs.map(l =>
          l.date === today ? { ...l, hoursWorked, notes } : l
        )
        newTotalHours = existingProgress.actualHoursSpent - existingLog.hoursWorked + hoursWorked
      } else {
        newLogs = [...existingProgress.dailyLogs, { date: today, hoursWorked, notes }]
        newTotalHours = existingProgress.actualHoursSpent + hoursWorked
      }

      return {
        ...c,
        progress: {
          ...existingProgress,
          lastActivityAt: new Date().toISOString(),
          dailyLogs: newLogs,
          actualHoursSpent: newTotalHours
        }
      }
    }))
  }

  // Get today's focus items
  const getTodaysFocus = () => {
    const today = new Date()
    const focusItems = []

    for (const contest of contests) {
      const hasNoSchedule = !contest.schedule
      const isCompleted = contest.status === 'completed'
      if (hasNoSchedule || isCompleted) continue

      const deadline = new Date(contest.info?.deadline)
      const isPastDeadline = deadline < today
      if (isPastDeadline) continue

      // Find current phase
      const currentPhase = contest.schedule.phases.find(phase => {
        const phaseStart = new Date(phase.startDate)
        const phaseEnd = new Date(phase.endDate)
        const isInPhase = phaseStart <= today && phaseEnd >= today
        const isNotCompleted = phase.status !== 'completed'
        return isInPhase && isNotCompleted
      })

      if (!currentPhase) continue

      // Calculate progress
      const actualHours = contest.progress?.actualHoursSpent || 0
      const phaseIndex = contest.schedule.phases.indexOf(currentPhase)
      const expectedHours = contest.schedule.totalEstimatedHours * 
        (phaseIndex + 0.5) / contest.schedule.phases.length
      const isBehind = actualHours < expectedHours * PROGRESS_BEHIND_THRESHOLD

      // Calculate days left and urgency
      const daysLeft = Math.ceil((deadline - today) / TIME_CONSTANTS.MILLISECONDS_PER_DAY)
      const urgency = calculateUrgency(daysLeft)

      // Calculate suggested hours for today
      const totalDays = Math.max(1, Math.ceil((deadline - today) / TIME_CONSTANTS.MILLISECONDS_PER_DAY))
      const suggestedHoursToday = Math.ceil(contest.schedule.totalEstimatedHours / totalDays)

      focusItems.push({
        contestId: contest.id,
        contestTitle: contest.info?.title || '제목 없음',
        phase: currentPhase,
        daysLeft,
        isBehind,
        urgency,
        suggestedHoursToday
      })
    }

    // Sort by urgency and behind status
    const urgencyOrder = { high: 0, medium: 1, low: 2 }
    return focusItems.sort((a, b) => {
      if (a.isBehind !== b.isBehind) return a.isBehind ? -1 : 1
      if (a.urgency !== b.urgency) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }
      return a.daysLeft - b.daysLeft
    })
  }

  // Get contests sorted by deadline
  const getUpcomingContests = () => {
    return contests
      .filter(c => c.status === 'interested' || c.status === 'applying')
      .filter(c => c.info?.deadline)
      .sort((a, b) => new Date(a.info.deadline) - new Date(b.info.deadline))
  }

  // Get contests with approaching deadlines (within N days)
  const getUrgentContests = (days = 7) => {
    const now = new Date()
    const threshold = new Date(now.getTime() + days * TIME_CONSTANTS.MILLISECONDS_PER_DAY)
    
    return getUpcomingContests().filter(contest => {
      const deadline = new Date(contest.info.deadline)
      const isWithinThreshold = deadline <= threshold
      const isNotPast = deadline >= now
      return isWithinThreshold && isNotPast
    })
  }

  const value = {
    contests,
    allContests,
    isLoaded,
    addContest,
    addToAllContests,
    removeFromAllContests,
    updateContest,
    removeContest,
    getContestById,
    updateContestProgress,
    toggleChecklistItem,
    addChecklistItem,
    generateSchedule,
    removeSchedule,
    updatePhaseStatus,
    logDailyProgress,
    getTodaysFocus,
    getUpcomingContests,
    getUrgentContests,
    DEFAULT_PHASES
  }

  return (
    <ContestsContext.Provider value={value}>
      {children}
    </ContestsContext.Provider>
  )
}

export function useContests() {
  const context = useContext(ContestsContext)
  if (!context) {
    throw new Error('useContests must be used within ContestsProvider')
  }
  return context
}
