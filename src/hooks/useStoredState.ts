import { useEffect, useState } from 'react'

export function useStoredState<T>(key: string, initialValue: T, isValid?: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return initialValue
      const parsed: unknown = JSON.parse(stored)
      const valid = isValid ? isValid(parsed) : true
      return valid ? parsed as T : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Keep the app usable if storage is full or unavailable.
    }
  }, [key, value])

  return [value, setValue] as const
}
