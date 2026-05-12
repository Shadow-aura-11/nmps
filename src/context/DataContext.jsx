import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth, getSessionStore, saveSessionStore, dataKey } from './AuthContext'
import { api } from '../utils/api'

const DataContext = createContext(null)

const INITIAL_MOCK_STUDENTS = []
const INITIAL_MOCK_STAFF = []
const INITIAL_MOCK_TRANSPORT = []
const INITIAL_MOCK_VEHICLES = []

export function DataProvider({ children }) {
  const { currentSession } = useAuth()

  // 1. Centralized State
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)

  // Session specific states
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState({})
  const [homework, setHomework] = useState([])
  const [notices, setNotices] = useState([])
  const [feeStats, setFeeStats] = useState({ collected: 0, pending: 0, overdue: 0, total: 2500000 })
  const [holidays, setHolidays] = useState(['2026-01-26', '2026-08-15', '2026-10-02'])
  
  const [generalExpenses, setGeneralExpenses] = useState([])
  const [fleetLogs, setFleetLogs] = useState([])
  const [transportRoutes, setTransportRoutes] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [refreshTick, setRefreshTick] = useState(0)

  // Load data when session changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      // Fetch Students
      const serverStudents = await api.get('students', currentSession)
      setStudents(serverStudents)

      // Fetch Staff
      const serverStaff = await api.get('staff')
      setStaff(serverStaff)

      // Fetch Session specific data
      const serverSessionData = await api.get('session_data', currentSession)
      if (serverSessionData && !Array.isArray(serverSessionData)) {
        setAttendance(serverSessionData.attendance || [])
        setMarks(serverSessionData.results || {})
        setHomework(serverSessionData.homework || [])
        setNotices(serverSessionData.notices || [])
        setFeeStats(serverSessionData.feeStats || { collected: 0, pending: 0, overdue: 0, total: 2500000 })
      } else {
        // Fallback to local store logic if server is empty
        const store = getSessionStore(currentSession)
        setAttendance(store.attendance || [])
        setMarks(store.results || {})
        setHomework(store.homework || [])
        setNotices(store.notices || [])
        setFeeStats(store.feeStats || { collected: 0, pending: 0, overdue: 0, total: 2500000 })
      }

      // Fetch Transport
      const serverRoutes = await api.get('transport', currentSession)
      setTransportRoutes(Array.isArray(serverRoutes) ? serverRoutes : [])

      // Fetch Expenses & Fleet
      const serverExpenses = await api.get('expenses', currentSession)
      setGeneralExpenses(Array.isArray(serverExpenses) ? serverExpenses : [])
      
      const serverFleet = await api.get('fleet_logs', currentSession)
      setFleetLogs(Array.isArray(serverFleet) ? serverFleet : [])

      const serverVehicles = await api.get('vehicles')
      setVehicles(Array.isArray(serverVehicles) ? serverVehicles : [])

      setLoading(false)
    }

    loadData()
  }, [currentSession])

  // 1.5. Dynamic Fee Statistics Calculation
  useEffect(() => {
    const feeKeyStr = `nms_fees_${currentSession}`
    const currentFees = JSON.parse(localStorage.getItem(feeKeyStr) || '{}')
    const globalFeeConfig = JSON.parse(localStorage.getItem('nms_global_fee_config') || '{"classFees":{},"transportFees":{}}')
    
    let totalCollected = 0
    let totalPending = 0
    let totalExpected = 0
    
    students.forEach(student => {
      const feeRecord = currentFees[student.id]
      
      if (feeRecord) {
        // Use explicit record if it exists
        totalCollected += Number(feeRecord.paid || 0)
        totalPending += Number(feeRecord.remaining || 0)
        totalExpected += (Number(feeRecord.total || 0) + Number(feeRecord.prevSessionDues || 0))
      } else {
        // Estimate based on global defaults if no record exists yet
        const classFee = Number(globalFeeConfig.classFees?.[student.class] || 40000)
        const transportFee = Number(globalFeeConfig.transportFees?.[student.transportRoute] || 0)
        const estimatedTotal = classFee + transportFee
        totalExpected += estimatedTotal
        totalPending += estimatedTotal
      }
    })
    
    setFeeStats({
      collected: totalCollected,
      pending: totalPending,
      total: totalExpected,
      overdue: totalPending // For now mapping pending to overdue as a proxy
    })
  }, [students, currentSession, refreshTick])

    const refreshData = useCallback(() => {
    // Force re-read of everything
    const savedStudents = localStorage.getItem(`nms_students_${currentSession}`) || localStorage.getItem('nms_students')
    if (savedStudents) setStudents(JSON.parse(savedStudents))

    const store = getSessionStore(currentSession)
    setAttendance(store.attendance || [])
    setMarks(store.results || {})
    setHomework(store.homework || [])
    setNotices(store.notices || [])
    setFeeStats(store.feeStats || { collected: 0, pending: 0, overdue: 0, total: 2500000 })
    
    const hSaved = localStorage.getItem('nms_holidays')
    if (hSaved) setHolidays(JSON.parse(hSaved))
    
    const sSaved = localStorage.getItem('nms_staff')
    if (sSaved) setStaff(JSON.parse(sSaved))

    setGeneralExpenses(JSON.parse(localStorage.getItem(`nms_expenses_${currentSession}`) || localStorage.getItem('nms_expenses') || '[]'))
    setFleetLogs(JSON.parse(localStorage.getItem(`nms_fleet_logs_${currentSession}`) || localStorage.getItem('nms_fleet_logs') || '[]'))
    
    setRefreshTick(t => t + 1)
  }, [currentSession])

  // 2. Storage Sync (Cross-Tab Support)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === `nms_students_${currentSession}`) setStudents(JSON.parse(e.newValue))
      if (e.key === 'nms_staff') setStaff(JSON.parse(e.newValue))
      if (e.key === dataKey(currentSession)) {
        const val = JSON.parse(e.newValue)
        setAttendance(val.attendance || [])
        setMarks(val.results || {})
        setHomework(val.homework || [])
        setNotices(val.notices || [])
        setFeeStats(val.feeStats || { collected: 0, pending: 0, overdue: 0, total: 2500000 })
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [currentSession])

  // 3. Update Helpers
  const updateStudents = useCallback((newData) => {
    setStudents(newData)
    api.save('students', newData, currentSession)
  }, [currentSession])

  const updateStaff = useCallback((newData) => {
    setStaff(newData)
    api.save('staff', newData)
  }, [])

  const updateAttendance = useCallback((newData) => {
    setAttendance(newData)
    const store = getSessionStore(currentSession)
    const updated = { ...store, attendance: newData }
    api.save('session_data', updated, currentSession)
    saveSessionStore(currentSession, updated)
  }, [currentSession])

  const updateMarks = useCallback((newData) => {
    setMarks(newData)
    const store = getSessionStore(currentSession)
    const updated = { ...store, results: newData }
    api.save('session_data', updated, currentSession)
    saveSessionStore(currentSession, updated)
  }, [currentSession])

  const updateHomework = useCallback((newData) => {
    setHomework(newData)
    const store = getSessionStore(currentSession)
    const updated = { ...store, homework: newData }
    api.save('session_data', updated, currentSession)
    saveSessionStore(currentSession, updated)
  }, [currentSession])

  const updateNotices = useCallback((newData) => {
    setNotices(newData)
    const store = getSessionStore(currentSession)
    const updated = { ...store, notices: newData }
    api.save('session_data', updated, currentSession)
    saveSessionStore(currentSession, updated)
  }, [currentSession])

  const updateFeeStats = useCallback((newData) => {
    setFeeStats(newData)
    const store = getSessionStore(currentSession)
    const updated = { ...store, feeStats: newData }
    api.save('session_data', updated, currentSession)
    saveSessionStore(currentSession, updated)
  }, [currentSession])

  const updateHolidays = useCallback((newData) => {
    setHolidays(newData)
    api.save('holidays', newData)
  }, [])

  const updateExpenses = useCallback((newData) => {
    setGeneralExpenses(newData)
    api.save('expenses', newData, currentSession)
  }, [currentSession])

  const updateFleetLogs = useCallback((newData) => {
    setFleetLogs(newData)
    api.save('fleet_logs', newData, currentSession)
  }, [currentSession])

  const updateVehicles = useCallback((newData) => {
    setVehicles(newData)
    api.save('vehicles', newData)
  }, [])

  const value = {
    students, updateStudents,
    staff, updateStaff,
    attendance, updateAttendance,
    marks, updateMarks,
    homework, updateHomework,
    notices, updateNotices,
    feeStats, updateFeeStats,
    holidays, updateHolidays,
    generalExpenses, updateExpenses,
    fleetLogs, updateFleetLogs,
    vehicles, updateVehicles,
    transportRoutes, updateTransportRoutes: (d) => { api.save('transport', d, currentSession); setTransportRoutes(d) },
    refreshData,
    loading
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error('useData must be used within DataProvider')
  return context
}
