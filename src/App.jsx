import { useRef, useState } from 'react'
import {
  demoStudents,
  hashPassword,
  loadAppData,
  saveAppData,
} from './utils/storage.js'
import './App.css'

const initialSkills = [
  { name: 'Web Development', category: 'Technology', icon: '💻', level: 'Beginner friendly', students: 24, description: 'Learn to build websites using HTML, CSS, JavaScript, and React.', ownerId: 'demo-student-ava' },
  { name: 'Python Programming', category: 'Programming', icon: '🐍', level: 'All levels', students: 18, description: 'Explore Python fundamentals, problem-solving, and small projects.', ownerId: 'demo-student-noah' },
  { name: 'UI/UX Design', category: 'Design', icon: '🎨', level: 'Beginner friendly', students: 15, description: 'Discover interface design, wireframes, prototypes, and user experience.', ownerId: 'demo-student-maya' },
  { name: 'Public Speaking', category: 'Communication', icon: '🎤', level: 'All levels', students: 12, description: 'Build confidence in presentations, interviews, and communication.', ownerId: 'demo-student-liam' },
  { name: 'Java Programming', category: 'Programming', icon: '☕', level: 'Beginner friendly', students: 20, description: 'Learn Java syntax, object-oriented programming, and coding basics.', ownerId: 'demo-student-noah' },
  { name: 'Graphic Design', category: 'Design', icon: '🖌️', level: 'All levels', students: 10, description: 'Practice layouts, colour combinations, and creative visual design.', ownerId: 'demo-student-maya' },
]

const initialProgress = {
  'Web Development': 60,
  'Python Programming': 35,
}

const avatarOptions = ['🧑‍🎓', '👩🏻‍💻', '👨🏽‍💻', '👩🏾‍🎨', '🧑🏻‍🏫', '🌱']
const departments = [
  'Computer Science',
  'Information Technology',
  'Visual Communication',
  'Business Administration',
  'Engineering',
  'Other',
]
const studyYears = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']
const navigationItems = [
  ['Dashboard', '⌂', 'dashboard'],
  ['Discover Skills', '⌕', 'discover'],
  ['Discover Students', '◎', 'students'],
  ['My Skills', '✧', 'my-skills'],
  ['Swap Requests', '⇄', 'requests'],
  ['My Progress', '▥', 'progress'],
  ['My Profile', '◉', 'profile'],
]

function App() {
  const [boot] = useState(() => loadAppData())
  const [data, setData] = useState(boot.data)
  const dataRef = useRef(boot.data)
  const [storageError, setStorageError] = useState(boot.error)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    year: '',
    bio: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [activePage, setActivePage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [requestSkill, setRequestSkill] = useState('')
  const [exchangeSkill, setExchangeSkill] = useState('')
  const [notice, setNotice] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skillInputType, setSkillInputType] = useState('teachSkills')
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentDepartment, setStudentDepartment] = useState('All departments')
  const [studentSkill, setStudentSkill] = useState('All skills')
  const [requestView, setRequestView] = useState('sent')
  const [profileDraft, setProfileDraft] = useState(
    boot.data.profiles[boot.data.sessionId] || null,
  )
  const [requestFeedback, setRequestFeedback] = useState('')

  const currentUser = data.users.find(user => user.id === data.sessionId)
  const profile = currentUser ? data.profiles[currentUser.id] : null
  const progress = currentUser
    ? data.progress[currentUser.id] || initialProgress
    : initialProgress
  const categories = ['All', ...new Set(initialSkills.map(skill => skill.category))]
  const filteredSkills = initialSkills.filter(skill => {
    const matchesSearch =
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.category.toLowerCase().includes(search.toLowerCase()) ||
      skill.level.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (category === 'All' || skill.category === category)
  })

  function commitData(updater) {
    const nextData = updater(dataRef.current)
    dataRef.current = nextData
    setData(nextData)
    try {
      saveAppData(nextData)
      setStorageError('')
    } catch {
      setStorageError('Changes could not be saved in this browser. Check local storage settings.')
    }
    return nextData
  }

  function changeAuthField(event) {
    setAuthForm(previous => ({ ...previous, [event.target.name]: event.target.value }))
  }

  function validateAuth() {
    if (authMode === 'register') {
      const required = ['name', 'email', 'password', 'confirmPassword', 'department', 'year', 'bio']
      if (required.some(field => !authForm[field].trim())) {
        return 'Please complete every field to create your student profile.'
      }
    } else if (!authForm.email.trim() || !authForm.password) {
      return 'Enter your student email and password.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authForm.email.trim())) {
      return 'Enter a valid student email address.'
    }
    if (authMode === 'register' && authForm.password.length < 8) {
      return 'Choose a password with at least 8 characters.'
    }
    if (authMode === 'register' && authForm.password !== authForm.confirmPassword) {
      return 'Your passwords do not match.'
    }
    return ''
  }

  async function submitAuth(event) {
    event.preventDefault()
    setAuthError('')
    setAuthMessage('')
    const validationError = validateAuth()
    if (validationError) {
      setAuthError(validationError)
      return
    }

    setAuthBusy(true)
    try {
      const email = authForm.email.trim().toLowerCase()
      if (authMode === 'register') {
        if (dataRef.current.users.some(user => user.email === email)) {
          setAuthError('An account with this email already exists. Please sign in instead.')
          return
        }

        const password = await hashPassword(authForm.password)
        const userId = crypto.randomUUID()
        const user = {
          id: userId,
          email,
          passwordSalt: password.salt,
          passwordHash: password.hash,
        }
        const nextProfile = {
          name: authForm.name.trim(),
          email,
          department: authForm.department,
          year: authForm.year,
          bio: authForm.bio.trim(),
          avatar: '🧑‍🎓',
          teachSkills: [],
          learnSkills: [],
          learningHours: 0,
        }
        commitData(previous => ({
          ...previous,
          users: [...previous.users, user],
          sessionId: userId,
          profiles: { ...previous.profiles, [userId]: nextProfile },
          progress: { ...previous.progress, [userId]: { ...initialProgress } },
        }))
        setProfileDraft(nextProfile)
        setAuthForm({ name: '', email: '', password: '', confirmPassword: '', department: '', year: '', bio: '' })
      } else {
        const user = dataRef.current.users.find(account => account.email === email)
        if (!user) {
          setAuthError('We could not find an account with that email. Check it or create an account.')
          return
        }

        const password = await hashPassword(authForm.password, user.passwordSalt)
        if (password.hash !== user.passwordHash) {
          setAuthError('That password does not match this account. Please try again.')
          return
        }

        const signedInProfile = dataRef.current.profiles[user.id]
        commitData(previous => ({ ...previous, sessionId: user.id }))
        setProfileDraft(signedInProfile)
        setAuthForm({ name: '', email: '', password: '', confirmPassword: '', department: '', year: '', bio: '' })
      }
      setActivePage('Dashboard')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign-in could not be completed.')
    } finally {
      setAuthBusy(false)
    }
  }

  function logout() {
    commitData(previous => ({ ...previous, sessionId: null }))
    setAuthMode('login')
    setAuthMessage('You have been signed out.')
    setNotice('')
    setSelectedSkill(null)
    setSelectedStudent(null)
  }

  function navigate(page, sectionId) {
    setActivePage(page)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function findStudent(studentId) {
    const registered = data.profiles[studentId]
    if (registered) return { ...registered, id: studentId, isDemo: false }
    return demoStudents.find(student => student.id === studentId) || null
  }

  function createRequest(recipient, skillName, skillCategory) {
    if (!currentUser || !recipient || !skillName) return false
    const duplicate = dataRef.current.requests.some(request =>
      request.senderId === currentUser.id &&
      request.recipientId === recipient.id &&
      request.skillName.toLowerCase() === skillName.toLowerCase() &&
      request.status === 'Pending',
    )
    if (duplicate) {
      setRequestFeedback(`You already have a pending request for ${skillName} with ${recipient.name}.`)
      return false
    }

    const request = {
      id: crypto.randomUUID(),
      senderId: currentUser.id,
      recipientId: recipient.id,
      skillName,
      category: skillCategory || 'Skill exchange',
      exchangeSkill: exchangeSkill || '',
      createdAt: new Date().toISOString(),
      status: 'Pending',
    }
    commitData(previous => ({ ...previous, requests: [...previous.requests, request] }))
    setRequestFeedback('')
    setNotice(`Your request for ${skillName} was sent to ${recipient.name}.`)
    return true
  }

  function sendSkillRequest(skill) {
    const recipient = findStudent(skill.ownerId)
    if (createRequest(recipient, skill.name, skill.category)) setSelectedSkill(null)
  }

  function sendStudentRequest(event) {
    event.preventDefault()
    if (selectedStudent && createRequest(selectedStudent, requestSkill, 'Skill exchange')) {
      setSelectedStudent(null)
      setRequestSkill('')
      setExchangeSkill('')
    }
  }

  function updateRequestStatus(requestId, status) {
    const request = dataRef.current.requests.find(item => item.id === requestId)
    if (!request || request.status !== 'Pending') return
    if (status !== 'Cancelled' && request.recipientId !== currentUser.id) return
    if (status === 'Cancelled' && request.senderId !== currentUser.id) return
    commitData(previous => ({
      ...previous,
      requests: previous.requests.map(item =>
        item.id === requestId && item.status === 'Pending' ? { ...item, status } : item,
      ),
    }))
    setNotice(`Request ${status.toLowerCase()}.`)
  }

  function addMySkill(event) {
    event.preventDefault()
    const value = skillInput.trim()
    if (!value || !profile) return
    const existingSkills = profile[skillInputType] || []
    if (existingSkills.some(item => item.toLowerCase() === value.toLowerCase())) {
      setNotice(`“${value}” is already in your ${skillInputType === 'teachSkills' ? 'teaching skills' : 'learning goals'}.`)
      return
    }
    const updatedProfile = { ...profile, [skillInputType]: [...existingSkills, value] }
    commitData(previous => ({
      ...previous,
      profiles: { ...previous.profiles, [currentUser.id]: updatedProfile },
    }))
    setSkillInput('')
    setShowSkillForm(false)
    setNotice(`Added “${value}” to your ${skillInputType === 'teachSkills' ? 'teaching skills' : 'learning goals'}.`)
  }

  function removeMySkill(type, skillName) {
    const updatedProfile = {
      ...profile,
      [type]: profile[type].filter(skill => skill !== skillName),
    }
    commitData(previous => ({
      ...previous,
      profiles: { ...previous.profiles, [currentUser.id]: updatedProfile },
    }))
  }

  function updateProgress(skillName, amount) {
    const updatedProgress = {
      ...progress,
      [skillName]: Math.min(100, Math.max(0, (progress[skillName] || 0) + amount)),
    }
    commitData(previous => ({
      ...previous,
      progress: { ...previous.progress, [currentUser.id]: updatedProgress },
    }))
  }

  function addLearningGoalProgress(skillName) {
    if (progress[skillName] !== undefined) return
    commitData(previous => ({
      ...previous,
      progress: {
        ...previous.progress,
        [currentUser.id]: { ...progress, [skillName]: 0 },
      },
    }))
  }

  function saveProfile(event) {
    event.preventDefault()
    if (!profileDraft?.name.trim() || !profileDraft?.bio.trim()) {
      setNotice('Name and introduction are required.')
      return
    }
    const updatedProfile = {
      ...profile,
      name: profileDraft.name,
      department: profileDraft.department,
      year: profileDraft.year,
      bio: profileDraft.bio,
      avatar: profileDraft.avatar,
    }
    commitData(previous => ({
      ...previous,
      profiles: { ...previous.profiles, [currentUser.id]: updatedProfile },
    }))
    setNotice('Your profile has been saved.')
  }

  const allStudents = [
    ...demoStudents.map(student => ({ ...student, isDemo: true })),
    ...data.users.map(user => ({
      ...data.profiles[user.id],
      id: user.id,
      isDemo: false,
    })),
  ].filter(student => student && student.id !== currentUser?.id)
  const allDepartments = ['All departments', ...new Set(allStudents.map(student => student.department))]
  const allOfferedSkills = ['All skills', ...new Set(allStudents.flatMap(student => student.teachSkills || []))]
  const filteredStudents = allStudents.filter(student => {
    const matchesSearch =
      student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.teachSkills.some(skill => skill.toLowerCase().includes(studentSearch.toLowerCase()))
    const matchesDepartment =
      studentDepartment === 'All departments' || student.department === studentDepartment
    const matchesSkill =
      studentSkill === 'All skills' || student.teachSkills.includes(studentSkill)
    return matchesSearch && matchesDepartment && matchesSkill
  })
  const sentRequests = data.requests.filter(request => request.senderId === currentUser?.id)
  const receivedRequests = data.requests.filter(request => request.recipientId === currentUser?.id)
  const visibleRequests = requestView === 'sent' ? sentRequests : receivedRequests
  const completedGoals = Object.values(progress).filter(value => value === 100).length

  if (!currentUser || !profile) {
    return (
      <div className="auth-page">
        <div className="auth-decoration auth-decoration-one"></div>
        <div className="auth-decoration auth-decoration-two"></div>
        <main className="auth-shell">
          <a className="brand auth-brand" href="#welcome">
            <span className="brand-icon">S</span>
            Skill<span>Swap</span>
          </a>
          <div className="auth-layout">
            <section className="auth-intro" id="welcome">
              <span className="eyebrow">LEARN TOGETHER. GROW TOGETHER.</span>
              <h1>Trade what you know for what you want to learn.</h1>
              <p>Meet fellow students, share your strengths, and make progress one skill at a time.</p>
              <div className="auth-points">
                <span>✦ Learn from your campus community</span>
                <span>✦ Share skills you already know</span>
                <span>✦ Keep your goals moving forward</span>
              </div>
              <div className="auth-demo-note">
                <strong>A friendly local prototype</strong>
                <p>Create an account to explore. Your demo profile stays in this browser.</p>
              </div>
            </section>

            <section className="auth-card">
              <span className="eyebrow">{authMode === 'login' ? 'WELCOME BACK' : 'START YOUR JOURNEY'}</span>
              <h2>{authMode === 'login' ? 'Sign in to SkillSwap' : 'Create your student account'}</h2>
              <p className="auth-card-copy">
                {authMode === 'login'
                  ? 'Pick up where your learning journey left off.'
                  : 'Tell your campus community a little about yourself.'}
              </p>

              {storageError && <p className="form-message error-message" role="alert">{storageError}</p>}
              {authError && <p className="form-message error-message" role="alert">{authError}</p>}
              {authMessage && <p className="form-message success-message" role="status">{authMessage}</p>}

              <form className="auth-form" onSubmit={submitAuth} noValidate>
                {authMode === 'register' && (
                  <>
                    <label>
                      Full name
                      <input name="name" autoComplete="name" value={authForm.name} onChange={changeAuthField} placeholder="Your name" />
                    </label>
                  </>
                )}
                <label>
                  Student email
                  <input name="email" type="email" autoComplete="email" value={authForm.email} onChange={changeAuthField} placeholder="you@college.edu" />
                </label>
                <label>
                  Password
                  <span className="password-field">
                    <input name="password" type={showPassword ? 'text' : 'password'} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authForm.password} onChange={changeAuthField} placeholder="At least 8 characters" />
                    <button className="password-toggle" type="button" onClick={() => setShowPassword(previous => !previous)}>
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </span>
                </label>
                {authMode === 'register' && (
                  <>
                    <label>
                      Confirm password
                      <input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={authForm.confirmPassword} onChange={changeAuthField} placeholder="Re-enter your password" />
                    </label>
                    <div className="form-two-columns">
                      <label>
                        Department
                        <select name="department" value={authForm.department} onChange={changeAuthField}>
                          <option value="">Choose department</option>
                          {departments.map(item => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                      <label>
                        Year of study
                        <select name="year" value={authForm.year} onChange={changeAuthField}>
                          <option value="">Choose year</option>
                          {studyYears.map(item => <option key={item}>{item}</option>)}
                        </select>
                      </label>
                    </div>
                    <label>
                      Short introduction
                      <textarea name="bio" rows="3" maxLength="240" value={authForm.bio} onChange={changeAuthField} placeholder="What are you excited to learn or share?" />
                    </label>
                  </>
                )}
                <button className="primary-button auth-submit" type="submit" disabled={authBusy}>
                  {authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign in' : 'Create account'}
                  {!authBusy && <span>→</span>}
                </button>
              </form>

              <p className="auth-switch">
                {authMode === 'login' ? 'New to SkillSwap?' : 'Already have an account?'}
                <button type="button" onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login')
                  setAuthError('')
                  setAuthMessage('')
                }}>
                  {authMode === 'login' ? 'Create an account' : 'Sign in'}
                </button>
              </p>
              <p className="auth-local-warning">Demo authentication only · Not for real passwords or sensitive data</p>
            </section>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#dashboard" onClick={() => navigate('Dashboard', 'dashboard')}>
          <span className="brand-icon">S</span>
          Skill<span>Swap</span>
        </a>
        <p className="menu-label">WORKSPACE</p>
        <nav className="navigation" aria-label="Main navigation">
          {navigationItems.map(([page, icon, id]) => (
            <button
              key={page}
              className={`nav-item ${activePage === page ? 'active' : ''}`}
              onClick={() => navigate(page, id)}
            >
              {icon} <span>{page}</span>
              {page === 'Swap Requests' && (sentRequests.filter(item => item.status === 'Pending').length > 0) && (
                <span className="request-count">{sentRequests.filter(item => item.status === 'Pending').length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span>💡</span>
            <strong>Keep growing!</strong>
            <p>Every skill you share makes someone stronger.</p>
          </div>
          <button className="profile-mini profile-button" onClick={() => navigate('My Profile', 'profile')}>
            <span className="avatar">{profile.avatar || profile.name.charAt(0).toUpperCase()}</span>
            <span className="profile-mini-copy">
              <strong>{profile.name}</strong>
              <small>{profile.department}</small>
            </span>
          </button>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="breadcrumb">Workspace / <strong>{activePage}</strong></div>
          <div className="topbar-right">
            <span className="online-dot"></span>
            Learning mode
            <button className="header-profile" onClick={() => navigate('My Profile', 'profile')} aria-label="Open your profile">
              <span className="avatar small">{profile.avatar || profile.name.charAt(0).toUpperCase()}</span>
              <span>{profile.name}</span>
            </button>
            <button className="logout-button" onClick={logout}>Sign out</button>
          </div>
        </header>

        {(notice || storageError) && (
          <div className={`app-notice ${storageError ? 'notice-error' : ''}`} role="status">
            {storageError || notice}
            <button aria-label="Dismiss message" onClick={() => { setNotice(''); setStorageError('') }}>×</button>
          </div>
        )}

        <section className="welcome-section">
          <div>
            <span className="eyebrow">YOUR LEARNING JOURNEY STARTS HERE</span>
            <h1>Learn something new.<br /><span>Teach something you love.</span></h1>
            <p>Welcome back, {profile.name.split(' ')[0]}. Connect with students, exchange skills, and grow together.</p>
            <button className="primary-button" onClick={() => navigate('Discover Skills', 'discover')}>
              Explore skills <span>→</span>
            </button>
          </div>
          <div className="welcome-art">
            <div className="art-circle circle-one"></div>
            <div className="art-circle circle-two"></div>
            <div className="floating-card card-top">✨ Learn by sharing</div>
            <div className="art-emoji">🤝</div>
            <div className="floating-card card-bottom">📚 Grow together</div>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card"><span className="stat-icon purple">✧</span><p>Skills available</p><h2>{initialSkills.length}</h2><small>Explore available skills</small></div>
          <div className="stat-card"><span className="stat-icon blue">♧</span><p>Student community</p><h2>{allStudents.length + 1}</h2><small>Students in this browser</small></div>
          <div className="stat-card"><span className="stat-icon orange">↗</span><p>My requests</p><h2>{sentRequests.length}</h2><small>Skill exchanges sent</small></div>
          <div className="stat-card"><span className="stat-icon green">✓</span><p>Goals completed</p><h2>{completedGoals}</h2><small>Skills completed</small></div>
        </section>

        <section className="section-heading" id="discover">
          <div><span className="eyebrow">FIND YOUR NEXT SKILL</span><h2>Discover skills</h2><p>Learn from someone who already knows it.</p></div>
          <span className="text-link">{filteredSkills.length} skills found</span>
        </section>
        <div className="search-bar">
          <span>⌕</span>
          <input aria-label="Search skills" placeholder="Search Python, design, communication..." value={search} onChange={event => setSearch(event.target.value)} />
          <button onClick={() => setSearch('')}>Clear</button>
        </div>
        <div className="category-filters" aria-label="Filter by category">
          {categories.map(item => (
            <button key={item} className={`filter-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <div className="skill-grid">
          {filteredSkills.map(skill => (
            <article className="skill-card" key={skill.name}>
              <div className="skill-card-top"><span className="skill-icon">{skill.icon}</span><span className="skill-category">{skill.category}</span></div>
              <h3>{skill.name}</h3><p>{skill.level}</p>
              <div className="skill-card-bottom"><span>👥 {skill.students} students</span><button onClick={() => { setSelectedSkill(skill); setNotice(''); setRequestFeedback('') }}>Learn more ↗</button></div>
            </article>
          ))}
          {filteredSkills.length === 0 && (
            <div className="panel empty-state"><h3>No skills found</h3><p>Try another search term or choose a different category.</p><button className="secondary-button" onClick={() => { setSearch(''); setCategory('All') }}>Reset filters</button></div>
          )}
        </div>

        <section className="student-section" id="students">
          <div className="section-heading">
            <div><span className="eyebrow">LEARN FROM YOUR COMMUNITY</span><h2>Discover students</h2><p>Find people who can teach what you want to learn.</p></div>
            <span className="text-link">{filteredStudents.length} students</span>
          </div>
          <div className="student-filters">
            <input aria-label="Search students by name or skill" placeholder="Search name or skill..." value={studentSearch} onChange={event => setStudentSearch(event.target.value)} />
            <select aria-label="Filter students by department" value={studentDepartment} onChange={event => setStudentDepartment(event.target.value)}>
              {allDepartments.map(item => <option key={item}>{item}</option>)}
            </select>
            <select aria-label="Filter students by skill" value={studentSkill} onChange={event => setStudentSkill(event.target.value)}>
              {allOfferedSkills.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <p className="demo-student-note">Sample profiles are labelled “Demo student”; registered classmates are stored only in this browser.</p>
          <div className="student-grid">
            {filteredStudents.map(student => (
              <article className="student-card" key={student.id}>
                <div className="student-card-head">
                  <span className="student-avatar">{student.avatar || student.name.charAt(0).toUpperCase()}</span>
                  <div><h3>{student.name}</h3><p>{student.department} · {student.year}</p></div>
                </div>
                {student.isDemo && <span className="demo-badge">Demo student</span>}
                <div className="student-skills">
                  {(student.teachSkills || []).slice(0, 4).map(skill => <span key={skill}>{skill}</span>)}
                  {!student.teachSkills?.length && <span>Still building a skills list</span>}
                </div>
                <div className="student-card-actions">
                  <button className="secondary-button" onClick={() => {
                    setSelectedStudent(student)
                    setRequestSkill('')
                    setExchangeSkill('')
                    setRequestFeedback('')
                  }}>View profile</button>
                  <button className="primary-button" onClick={() => {
                    setSelectedStudent(student)
                    setRequestSkill(student.teachSkills?.[0] || '')
                    setExchangeSkill('')
                    setRequestFeedback('')
                    setNotice('')
                  }}>Request exchange</button>
                </div>
              </article>
            ))}
            {filteredStudents.length === 0 && <div className="panel empty-state"><h3>No students match those filters</h3><p>Adjust your search or clear one of the filters.</p></div>}
          </div>
        </section>

        <section className="bottom-grid" id="progress">
          <div className="panel" id="my-skills">
            <span className="eyebrow">YOUR CONTRIBUTION</span><h2>Skills I can teach</h2><p>Share what you know with your community.</p>
            <SkillTags skills={profile.teachSkills} type="teachSkills" onRemove={removeMySkill} />
            <div className="skills-subheading"><strong>Skills I want to learn</strong></div>
            <SkillTags skills={profile.learnSkills} type="learnSkills" onRemove={removeMySkill} />
            {showSkillForm ? (
              <form className="add-skill-form" onSubmit={addMySkill}>
                <select aria-label="Skill list type" value={skillInputType} onChange={event => setSkillInputType(event.target.value)}>
                  <option value="teachSkills">I can teach</option><option value="learnSkills">I want to learn</option>
                </select>
                <input aria-label="New skill name" placeholder="Enter a skill..." value={skillInput} onChange={event => setSkillInput(event.target.value)} maxLength="60" />
                <button className="secondary-button" type="submit">Save skill</button>
                <button className="cancel-button" type="button" onClick={() => { setShowSkillForm(false); setSkillInput('') }}>Cancel</button>
              </form>
            ) : (
              <button className="secondary-button" onClick={() => setShowSkillForm(true)}>+ Add a skill or learning goal</button>
            )}
          </div>

          <div className="panel">
            <span className="eyebrow">KEEP IT UP</span><h2>Learning progress</h2><p>Update your progress as you learn.</p>
            {Object.entries(progress).map(([name, value]) => (
              <div className="progress-item" key={name}>
                <div className="progress-row"><span>{name}</span><strong>{value}%</strong></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${value}%` }}></div></div>
                <div className="progress-actions">
                  <button disabled={value === 0} onClick={() => updateProgress(name, -10)}>− 10%</button>
                  <button disabled={value === 100} onClick={() => updateProgress(name, 10)}>+ 10%</button>
                </div>
              </div>
            ))}
            {profile.learnSkills.filter(skill => progress[skill] === undefined).map(skill => (
              <div className="new-goal-row" key={skill}><span>{skill}</span><button className="secondary-button" onClick={() => addLearningGoalProgress(skill)}>Track goal</button></div>
            ))}
            {Object.keys(progress).length === 0 && <p className="empty-message">Add a learning goal to start tracking your progress.</p>}
          </div>
        </section>

        <section className="panel requests-panel" id="requests">
          <span className="eyebrow">CONNECT AND COLLABORATE</span><h2>Swap requests</h2><p>Manage the exchanges you send and receive.</p>
          <div className="request-tabs" role="tablist" aria-label="Request type">
            <button role="tab" aria-selected={requestView === 'sent'} className={requestView === 'sent' ? 'selected' : ''} onClick={() => setRequestView('sent')}>Sent <span>{sentRequests.length}</span></button>
            <button role="tab" aria-selected={requestView === 'received'} className={requestView === 'received' ? 'selected' : ''} onClick={() => setRequestView('received')}>Received <span>{receivedRequests.length}</span></button>
          </div>
          {visibleRequests.length === 0 ? (
            <p className="empty-message">{requestView === 'sent' ? 'No requests sent yet. Find a student or skill and start an exchange.' : 'No incoming requests yet. Your next skill share could start one!'}</p>
          ) : (
            <div className="request-list">
              {visibleRequests.map(request => {
                const otherStudent = findStudent(requestView === 'sent' ? request.recipientId : request.senderId)
                return (
                  <div className="request-item" key={request.id}>
                    <div className="request-person-avatar">{otherStudent?.avatar || otherStudent?.name?.charAt(0) || 'S'}</div>
                    <div className="request-description">
                      <strong>{request.skillName}</strong>
                      <p>{request.category} · {requestView === 'sent' ? `To ${otherStudent?.name || 'student'}` : `From ${otherStudent?.name || 'student'}`}</p>
                      {request.exchangeSkill && <small>Offering to teach: {request.exchangeSkill}</small>}
                      <small>{new Date(request.createdAt).toLocaleDateString()}</small>
                    </div>
                    <span className={`request-status status-${request.status.toLowerCase()}`}>{request.status}</span>
                    {request.status === 'Pending' && requestView === 'sent' && (
                      <button className="cancel-button" onClick={() => updateRequestStatus(request.id, 'Cancelled')}>Cancel</button>
                    )}
                    {request.status === 'Pending' && requestView === 'received' && (
                      <div className="request-actions">
                        <button className="secondary-button" onClick={() => updateRequestStatus(request.id, 'Rejected')}>Decline</button>
                        <button className="primary-button" onClick={() => updateRequestStatus(request.id, 'Accepted')}>Accept</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="profile-section panel" id="profile">
          <div className="profile-section-heading"><div><span className="eyebrow">YOUR STUDENT PROFILE</span><h2>My profile</h2><p>Keep your information and skills up to date.</p></div><span className="profile-hours">{profile.learningHours} learning hours · {completedGoals} completed goals</span></div>
          <form className="profile-form" onSubmit={saveProfile}>
            <label className="avatar-picker">
              Profile avatar
              <span className="profile-avatar-preview">{profileDraft?.avatar || profile.avatar}</span>
              <select aria-label="Choose an avatar" value={profileDraft?.avatar || profile.avatar} onChange={event => setProfileDraft(previous => ({ ...previous, avatar: event.target.value }))}>
                {avatarOptions.map(avatar => <option key={avatar} value={avatar}>{avatar}</option>)}
              </select>
            </label>
            <label>Full name<input value={profileDraft?.name || ''} onChange={event => setProfileDraft(previous => ({ ...previous, name: event.target.value }))} /></label>
            <label>Email<input value={profile.email} disabled /></label>
            <label>Department<select value={profileDraft?.department || ''} onChange={event => setProfileDraft(previous => ({ ...previous, department: event.target.value }))}>{departments.map(item => <option key={item}>{item}</option>)}</select></label>
            <label>Year of study<select value={profileDraft?.year || ''} onChange={event => setProfileDraft(previous => ({ ...previous, year: event.target.value }))}>{studyYears.map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="profile-bio-field">Short introduction<textarea rows="3" maxLength="240" value={profileDraft?.bio || ''} onChange={event => setProfileDraft(previous => ({ ...previous, bio: event.target.value }))} /></label>
            <div className="profile-skills-readonly"><strong>Skills I can teach</strong><p>{profile.teachSkills.join(' · ') || 'Add skills in the My Skills panel.'}</p><strong>Skills I want to learn</strong><p>{profile.learnSkills.join(' · ') || 'Add learning goals in the My Skills panel.'}</p></div>
            <button className="primary-button" type="submit">Save profile</button>
          </form>
        </section>

        <footer>© 2026 SkillSwap · Learn together. Grow together.</footer>
      </main>

      {selectedSkill && (
        <div className="modal-backdrop" onClick={() => setSelectedSkill(null)}>
          <section className="skill-modal" role="dialog" aria-modal="true" aria-labelledby="skill-modal-title" onClick={event => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close skill details" onClick={() => setSelectedSkill(null)}>×</button>
            <div className="skill-icon modal-icon">{selectedSkill.icon}</div><span className="skill-category">{selectedSkill.category}</span>
            <h2 id="skill-modal-title">{selectedSkill.name}</h2><p>{selectedSkill.description}</p><p>Level: {selectedSkill.level}</p><p>👥 {selectedSkill.students} interested students</p>
            {requestFeedback && <p className="form-message error-message" role="alert">{requestFeedback}</p>}
            <button className="primary-button" onClick={() => sendSkillRequest(selectedSkill)}>Request skill exchange →</button>
          </section>
        </div>
      )}

      {selectedStudent && (
        <div className="modal-backdrop" onClick={() => setSelectedStudent(null)}>
          <section className="student-modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title" onClick={event => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close student profile" onClick={() => setSelectedStudent(null)}>×</button>
            <div className="public-profile-head">
              <span className="student-avatar large">{selectedStudent.avatar || selectedStudent.name.charAt(0).toUpperCase()}</span>
              <div><h2 id="student-modal-title">{selectedStudent.name}</h2><p>{selectedStudent.department} · {selectedStudent.year}</p></div>
            </div>
            {selectedStudent.isDemo && <span className="demo-badge">Demo student</span>}
            <p className="public-profile-bio">{selectedStudent.bio}</p>
            <strong>Skills they can teach</strong>
            <div className="student-skills">{(selectedStudent.teachSkills || []).map(skill => <span key={skill}>{skill}</span>)}</div>
            <strong>Skills they want to learn</strong>
            <div className="student-skills">{(selectedStudent.learnSkills || []).map(skill => <span key={skill}>{skill}</span>)}</div>
            {requestFeedback && <p className="form-message error-message" role="alert">{requestFeedback}</p>}
            <form className="student-request-form" onSubmit={sendStudentRequest}>
              <label>Skill you want to learn<select required value={requestSkill} onChange={event => setRequestSkill(event.target.value)}><option value="">Choose a skill</option>{(selectedStudent.teachSkills || []).map(skill => <option key={skill}>{skill}</option>)}</select></label>
              <label>Skill you can offer in exchange (optional)<select value={exchangeSkill} onChange={event => setExchangeSkill(event.target.value)}><option value="">No skill selected</option>{profile.teachSkills.map(skill => <option key={skill}>{skill}</option>)}</select></label>
              <button className="primary-button" type="submit">Request skill exchange →</button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

function SkillTags({ skills, type, onRemove }) {
  return (
    <div className="tag-list">
      {skills.map(skill => (
        <span className="removable-tag" key={skill}>
          {skill}
          <button aria-label={`Remove ${skill}`} onClick={() => onRemove(type, skill)}>×</button>
        </span>
      ))}
      {skills.length === 0 && <span className="skill-list-empty">No skills added yet</span>}
    </div>
  )
}

export default App
