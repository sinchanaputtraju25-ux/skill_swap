export const STORAGE_KEY = 'skillswap-demo-data-v1'

export const demoStudents = [
  {
    id: 'demo-student-ava',
    name: 'Ava Chen',
    email: 'ava.demo@skillswap.local',
    department: 'Computer Science',
    year: '3rd Year',
    bio: 'Frontend developer who enjoys making complex ideas feel simple.',
    avatar: '👩🏻‍💻',
    teachSkills: ['Web Development', 'JavaScript', 'React'],
    learnSkills: ['UI/UX Design', 'Public Speaking'],
    learningHours: 42,
  },
  {
    id: 'demo-student-noah',
    name: 'Noah Williams',
    email: 'noah.demo@skillswap.local',
    department: 'Information Technology',
    year: '2nd Year',
    bio: 'Python enthusiast building small tools that solve everyday problems.',
    avatar: '👨🏽‍💻',
    teachSkills: ['Python Programming', 'Data Analysis'],
    learnSkills: ['Graphic Design', 'Java'],
    learningHours: 28,
  },
  {
    id: 'demo-student-maya',
    name: 'Maya Patel',
    email: 'maya.demo@skillswap.local',
    department: 'Visual Communication',
    year: '4th Year',
    bio: 'Visual storyteller interested in thoughtful, accessible design.',
    avatar: '👩🏾‍🎨',
    teachSkills: ['UI/UX Design', 'Graphic Design'],
    learnSkills: ['Web Development', 'Public Speaking'],
    learningHours: 56,
  },
  {
    id: 'demo-student-liam',
    name: 'Liam Garcia',
    email: 'liam.demo@skillswap.local',
    department: 'Business Administration',
    year: '3rd Year',
    bio: 'I help people communicate clearly and feel confident presenting.',
    avatar: '🧑🏻‍🏫',
    teachSkills: ['Public Speaking', 'Presentation Skills'],
    learnSkills: ['Python Programming', 'Java'],
    learningHours: 35,
  },
]

export function createInitialData() {
  return {
    users: [],
    sessionId: null,
    profiles: {},
    requests: [],
    progress: {},
  }
}

export function loadAppData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { data: createInitialData(), error: '' }

    const parsed = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Saved data must be an object.')
    }

    const defaults = createInitialData()
    const users = Array.isArray(parsed.users)
      ? parsed.users.filter(user =>
          user &&
          typeof user === 'object' &&
          typeof user.id === 'string' &&
          typeof user.email === 'string' &&
          typeof user.passwordSalt === 'string' &&
          typeof user.passwordHash === 'string',
        )
      : defaults.users
    const userIds = new Set(users.map(user => user.id))
    const savedProfiles =
      parsed.profiles && typeof parsed.profiles === 'object' && !Array.isArray(parsed.profiles)
        ? parsed.profiles
        : {}
    const profiles = Object.fromEntries(users.map(user => {
      const savedProfile = savedProfiles[user.id]
      const profile =
        savedProfile && typeof savedProfile === 'object' && !Array.isArray(savedProfile)
          ? savedProfile
          : {}
      return [
        user.id,
        {
          name: typeof profile.name === 'string' && profile.name.trim()
            ? profile.name
            : user.email.split('@')[0],
          email: user.email,
          department: typeof profile.department === 'string' ? profile.department : 'Other',
          year: typeof profile.year === 'string' ? profile.year : '1st Year',
          bio: typeof profile.bio === 'string' ? profile.bio : '',
          avatar: typeof profile.avatar === 'string' ? profile.avatar : '🧑‍🎓',
          teachSkills: Array.isArray(profile.teachSkills)
            ? profile.teachSkills.filter(skill => typeof skill === 'string')
            : [],
          learnSkills: Array.isArray(profile.learnSkills)
            ? profile.learnSkills.filter(skill => typeof skill === 'string')
            : [],
          learningHours: Number.isFinite(profile.learningHours) ? profile.learningHours : 0,
        },
      ]
    }))
    const requests = Array.isArray(parsed.requests)
      ? parsed.requests.filter(request =>
          request &&
          typeof request === 'object' &&
          typeof request.id === 'string' &&
          typeof request.senderId === 'string' &&
          typeof request.recipientId === 'string' &&
          typeof request.skillName === 'string' &&
          ['Pending', 'Accepted', 'Rejected', 'Cancelled'].includes(request.status),
        ).map(request => ({
          ...request,
          category: typeof request.category === 'string' ? request.category : 'Skill exchange',
          exchangeSkill: typeof request.exchangeSkill === 'string' ? request.exchangeSkill : '',
          createdAt: typeof request.createdAt === 'string' ? request.createdAt : new Date(0).toISOString(),
        }))
      : defaults.requests
    const progress = {}
    if (parsed.progress && typeof parsed.progress === 'object' && !Array.isArray(parsed.progress)) {
      for (const userId of userIds) {
        const savedProgress = parsed.progress[userId]
        if (!savedProgress || typeof savedProgress !== 'object' || Array.isArray(savedProgress)) continue
        progress[userId] = Object.fromEntries(
          Object.entries(savedProgress)
            .filter(([name, value]) => name.trim() && Number.isFinite(value))
            .map(([name, value]) => [name, Math.min(100, Math.max(0, value))]),
        )
      }
    }
    return {
      data: {
        users,
        sessionId:
          typeof parsed.sessionId === 'string' && userIds.has(parsed.sessionId)
            ? parsed.sessionId
            : null,
        profiles,
        requests,
        progress,
      },
      error: '',
    }
  } catch {
    return {
      data: createInitialData(),
      error: 'Saved demo data could not be read. The app started with fresh local data.',
    }
  }
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export async function hashPassword(password, saltHex) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure password hashing is unavailable in this browser.')
  }

  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{1,2}/g).map(byte => Number.parseInt(byte, 16)))
    : crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  )

  return {
    salt: Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join(''),
    hash: Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join(''),
  }
}
