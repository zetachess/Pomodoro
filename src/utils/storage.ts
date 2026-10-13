import type { Session, Settings, Task, TimerState } from '../types'

export const STORAGE_KEYS = {
  settings: 'pomogoblin-settings',
  tasks: 'pomogoblin-tasks',
  sessions: 'pomogoblin-sessions',
  timer: 'pomogoblin-timer',
  activeTask: 'pomogoblin-active-task',
} as const

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isNumberBetween = (value: unknown, min: number, max: number): value is number => isFiniteNumber(value) && value >= min && value <= max
const isNonNegativeNumber = (value: unknown): value is number => isFiniteNumber(value) && value >= 0
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isString = (value: unknown): value is string => typeof value === 'string'

export function isSettings(value: unknown): value is Settings {
  return isRecord(value)
    && isNumberBetween(value.focusMinutes, 1, 90)
    && isNumberBetween(value.shortBreakMinutes, 1, 30)
    && isNumberBetween(value.longBreakMinutes, 1, 60)
    && isNumberBetween(value.cyclesBeforeLongBreak, 2, 8)
    && isBoolean(value.soundEnabled) && isNumberBetween(value.volume, 0, 1)
    && isBoolean(value.autoStart) && isBoolean(value.notifications)
}

export function isTask(value: unknown): value is Task {
  return isRecord(value)
    && isString(value.id) && value.id.length <= 200
    && isString(value.title) && value.title.length > 0 && value.title.length <= 500
    && isNonNegativeNumber(value.estimate)
    && isNonNegativeNumber(value.completedPomodoros)
    && isBoolean(value.done) && isFiniteNumber(value.createdAt)
    && (value.completedAt === undefined || isFiniteNumber(value.completedAt))
}

export function isSession(value: unknown): value is Session {
  return isRecord(value)
    && isString(value.id) && value.id.length <= 200
    && (value.mode === 'focus' || value.mode === 'shortBreak' || value.mode === 'longBreak')
    && isNumberBetween(value.durationMinutes, Number.MIN_VALUE, Number.MAX_SAFE_INTEGER) && isFiniteNumber(value.completedAt)
    && (value.taskId === null || isString(value.taskId)) && isString(value.taskTitle) && value.taskTitle.length <= 500
}

export function isTimerState(value: unknown): value is TimerState {
  return isRecord(value)
    && (value.mode === 'focus' || value.mode === 'shortBreak' || value.mode === 'longBreak')
    && isNonNegativeNumber(value.remainingSeconds) && isBoolean(value.running)
    && (value.endAt === null || isFiniteNumber(value.endAt))
    && isNonNegativeNumber(value.completedFocusCount)
}

export const isTaskList = (value: unknown): value is Task[] => Array.isArray(value) && value.every(isTask)
export const isSessionList = (value: unknown): value is Session[] => Array.isArray(value) && value.every(isSession)
export const isActiveTaskId = (value: unknown): value is string | null => value === null || (isString(value) && value.length <= 200)
