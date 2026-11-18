export type Role = 'admin' | 'teacher' | 'student' | 'parent'

export interface Session {
  role: Role
  id: string
  adminUser?: string
}

export interface LoginResult {
  ok: boolean
  role: Role
  id: string
}

/** server.js /api/data qaytaradigan asosiy ma'lumot (bosqichma-bosqich to‘ldiriladi) */
export interface AppData {
  subjects: unknown[]
  teachers: unknown[]
  groups: unknown[]
  timetable: unknown[]
  students: unknown[]
  [key: string]: unknown
}
