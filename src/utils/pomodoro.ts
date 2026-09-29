import type { SessionMode, Settings } from '../types'

export function durationFor(mode: SessionMode, settings: Settings) {
  if (mode === 'focus') return settings.focusMinutes
  if (mode === 'shortBreak') return settings.shortBreakMinutes
  return settings.longBreakMinutes
}

export function modeLabel(mode: SessionMode) {
  if (mode === 'focus') return 'Focus'
  if (mode === 'shortBreak') return 'Pausa corta'
  return 'Pausa larga'
}

export function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

export function sameLocalDay(a: number, b: number) {
  const left = new Date(a)
  const right = new Date(b)
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}
