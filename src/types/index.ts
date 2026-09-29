export type SessionMode = 'focus' | 'shortBreak' | 'longBreak'
export type View = 'studio' | 'history' | 'settings' | 'guide'

export interface Task {
  id: string
  title: string
  estimate: number
  completedPomodoros: number
  done: boolean
  createdAt: number
  completedAt?: number
}

export interface Session {
  id: string
  mode: SessionMode
  durationMinutes: number
  completedAt: number
  taskId: string | null
  taskTitle: string
}

export interface Settings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
  soundEnabled: boolean
  volume: number
  autoStart: boolean
  notifications: boolean
}

export interface TimerState {
  mode: SessionMode
  remainingSeconds: number
  running: boolean
  endAt: number | null
  completedFocusCount: number
}

export const defaultSettings: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  volume: 0.35,
  autoStart: false,
  notifications: false,
}

export const defaultTimer: TimerState = {
  mode: 'focus',
  remainingSeconds: 25 * 60,
  running: false,
  endAt: null,
  completedFocusCount: 0,
}
