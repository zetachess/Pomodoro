import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlarmClock, ArrowDownRight, ArrowRight, Award, BarChart3, BookOpen, Check, CheckCircle2,
  ChevronDown, Clock3, Coffee, Command, CornerDownLeft, Flame, History, ListTodo,
  Copy, MessageCircle, Minus, MoreHorizontal, Pause, Play, Plus, RotateCcw, Settings2, SkipForward,
  Sparkles, Target, Brain, Hourglass, Trophy, Volume2, VolumeX, X,
} from 'lucide-react'
import { useStoredState } from './hooks/useStoredState'
import { defaultSettings, defaultTimer, type Session, type SessionMode, type Settings, type Task, type TimerState, type View } from './types'
import { durationFor, formatTime, modeLabel, sameLocalDay } from './utils/pomodoro'

const navItems: { id: View; label: string; icon: typeof Clock3 }[] = [
  { id: 'studio', label: 'Temporizador', icon: Clock3 },
  { id: 'history', label: 'Historial', icon: History },
  { id: 'settings', label: 'Ajustes', icon: Settings2 },
  { id: 'guide', label: 'Cómo funciona', icon: BookOpen },
]

function playChime(volume: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(660, context.currentTime)
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.16)
    gain.gain.setValueAtTime(Math.max(volume * 0.14, 0.001), context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.55)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.56)
    oscillator.onended = () => void context.close()
  } catch {
    // Audio is an enhancement; timer completion still works without it.
  }
}

function App() {
  const [settings, setSettings] = useStoredState<Settings>('pomogoblin-settings', defaultSettings)
  const [tasks, setTasks] = useStoredState<Task[]>('pomogoblin-tasks', [])
  const [sessions, setSessions] = useStoredState<Session[]>('pomogoblin-sessions', [])
  const [timer, setTimer] = useStoredState<TimerState>('pomogoblin-timer', defaultTimer)
  const [activeTaskId, setActiveTaskId] = useStoredState<string | null>('pomogoblin-active-task', null)
  const [view, setView] = useState<View>('studio')
  const [, setClock] = useState(Date.now())
  const [taskDraft, setTaskDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const taskInputRef = useRef<HTMLInputElement>(null)
  const notifiedRef = useRef(false)
  const finishSessionRef = useRef<() => void>(() => undefined)

  const remaining = timer.running && timer.endAt ? Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)) : timer.remainingSeconds
  const activeTask = tasks.find((task) => task.id === activeTaskId && !task.done) ?? null
  const focusSessions = sessions.filter((session) => session.mode === 'focus')
  const todayFocus = focusSessions.filter((session) => sameLocalDay(session.completedAt, Date.now()))
  const todayMinutes = todayFocus.reduce((total, session) => total + session.durationMinutes, 0)
  const todayCompletedTasks = tasks.filter((task) => task.done && task.completedAt && sameLocalDay(task.completedAt, Date.now())).length
  const completedTasks = tasks.filter((task) => task.done).length
  const dailySummary = `🍅 Mi resumen de hoy · ${new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(Date.now())}\n🎯 ${todayFocus.length} ${todayFocus.length === 1 ? 'sesión' : 'sesiones'} Focus\n⏱️ ${todayMinutes} min en modo Focus\n✅ ${todayCompletedTasks} ${todayCompletedTasks === 1 ? 'tarea completada' : 'tareas completadas'}\n\nPaso a paso se avanza. 💪`
  const streak = useMemo(() => {
    const days = new Set(focusSessions.map((session) => new Date(session.completedAt).toLocaleDateString('en-CA')))
    let count = 0
    const date = new Date()
    if (!days.has(date.toLocaleDateString('en-CA'))) date.setDate(date.getDate() - 1)
    while (days.has(date.toLocaleDateString('en-CA'))) {
      count += 1
      date.setDate(date.getDate() - 1)
    }
    return count
  }, [focusSessions])

  const week = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    const daySessions = focusSessions.filter((session) => sameLocalDay(session.completedAt, date.getTime()))
    return {
      key: date.toISOString(),
      label: new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date),
      count: daySessions.length,
      minutes: daySessions.reduce((sum, session) => sum + session.durationMinutes, 0),
      today: sameLocalDay(date.getTime(), Date.now()),
    }
  }), [focusSessions])
  const maxWeek = Math.max(1, ...week.map((day) => day.minutes))

  useEffect(() => {
    if (!timer.running) return
    const interval = window.setInterval(() => {
      const now = Date.now()
      setClock(now)
      if (timer.endAt && timer.endAt <= now && !notifiedRef.current) {
        notifiedRef.current = true
        finishSessionRef.current()
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [timer.running, timer.endAt])

  useEffect(() => {
    document.title = `${formatTime(remaining)} · POMODORO TIMER`
  }, [remaining])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  function finishSession() {
    const completedMode = timer.mode
    const duration = durationFor(completedMode, settings)
    const nextCount = completedMode === 'focus' ? timer.completedFocusCount + 1 : timer.completedFocusCount
    const nextMode: SessionMode = completedMode !== 'focus'
      ? 'focus'
      : nextCount % settings.cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak'
    const session: Session = {
      id: crypto.randomUUID(),
      mode: completedMode,
      durationMinutes: duration,
      completedAt: Date.now(),
      taskId: completedMode === 'focus' ? activeTask?.id ?? null : null,
      taskTitle: completedMode === 'focus' ? activeTask?.title ?? 'Sesión sin tarea' : 'Descanso',
    }
    setSessions((current) => [session, ...current])
    if (completedMode === 'focus' && activeTask) {
      setTasks((current) => current.map((task) => task.id === activeTask.id ? { ...task, completedPomodoros: task.completedPomodoros + 1 } : task))
    }
    if (settings.soundEnabled) playChime(settings.volume)
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(completedMode === 'focus' ? 'Sesión de Focus completada' : 'Descanso terminado', {
        body: completedMode === 'focus' ? 'Buen trabajo. Tómate un momento para recargar energía.' : '¿Listo para volver a concentrarte?',
      })
    }
    setToast(completedMode === 'focus' ? 'Sesión de Focus completada. Respira un momento.' : 'Descanso terminado. ¡Tú puedes!')
    const nextSeconds = durationFor(nextMode, settings) * 60
    notifiedRef.current = false
    setTimer({ mode: nextMode, remainingSeconds: nextSeconds, running: settings.autoStart, endAt: settings.autoStart ? Date.now() + nextSeconds * 1000 : null, completedFocusCount: nextCount })
  }
  finishSessionRef.current = finishSession

  function startTimer() {
    if (remaining <= 0) return finishSession()
    notifiedRef.current = false
    setTimer({ ...timer, remainingSeconds: remaining, running: true, endAt: Date.now() + remaining * 1000 })
  }

  function pauseTimer() {
    setTimer({ ...timer, remainingSeconds: remaining, running: false, endAt: null })
  }

  function resetTimer() {
    const seconds = durationFor(timer.mode, settings) * 60
    notifiedRef.current = false
    setTimer({ ...timer, remainingSeconds: seconds, running: false, endAt: null })
  }

  function skipTimer() {
    if (timer.mode === 'focus') {
      const nextCount = timer.completedFocusCount
      const nextMode = nextCount % settings.cyclesBeforeLongBreak === 0 ? 'longBreak' : 'shortBreak'
      const seconds = durationFor(nextMode, settings) * 60
      setTimer({ mode: nextMode, remainingSeconds: seconds, running: false, endAt: null, completedFocusCount: timer.completedFocusCount })
    } else {
      const seconds = settings.focusMinutes * 60
      setTimer({ ...timer, mode: 'focus', remainingSeconds: seconds, running: false, endAt: null })
    }
    notifiedRef.current = false
  }

  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = taskDraft.trim()
    if (!title) return
    const task: Task = { id: crypto.randomUUID(), title, estimate: 1, completedPomodoros: 0, done: false, createdAt: Date.now() }
    setTasks((current) => [task, ...current])
    setTaskDraft('')
  }

  function saveEdit(taskId: string) {
    const title = editDraft.trim()
    if (title) setTasks((current) => current.map((task) => task.id === taskId ? { ...task, title } : task))
    setEditingId(null)
  }

  function toggleTask(task: Task) {
    const done = !task.done
    const completedAt = done ? Date.now() : undefined
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, done, completedAt } : item))
    if (done && activeTaskId === task.id) setActiveTaskId(null)
    if (done) {
      if (settings.soundEnabled) playChime(settings.volume)
      setToast('¡Tarea completada! Buen trabajo.')
      setCelebratingTaskId(task.id)
      window.setTimeout(() => setCelebratingTaskId((current) => current === task.id ? null : current), 1100)
    } else {
      setCelebratingTaskId(null)
      setToast('Tarea reabierta.')
    }
  }

  async function copyDailySummary() {
    try {
      await navigator.clipboard.writeText(dailySummary)
      setToast('Resumen copiado. Ya puedes compartirlo donde quieras.')
    } catch {
      setToast('No se pudo copiar. Prueba a compartirlo por WhatsApp.')
    }
  }

  async function toggleNotifications(enabled: boolean) {
    if (!enabled) {
      setSettings({ ...settings, notifications: false })
      return
    }
    if (!('Notification' in window)) {
      setToast('Este navegador no admite notificaciones.')
      return
    }
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
    if (permission === 'granted') setSettings({ ...settings, notifications: true })
    else setToast('Permite las notificaciones en los ajustes del navegador para activarlas aquí.')
  }

  const modeColor = timer.mode === 'focus' ? 'tomato' : 'mint'
  const shownTasks = tasks.filter((task) => showAllTasks || !task.done).slice(0, showAllTasks ? 8 : 4)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#studio" onClick={() => setView('studio')} aria-label="Inicio de Pomodoro Timer">
          <span className="brand-mark"><img src="/pomodoro-timer.png" alt="" /></span>
          <span>POMODORO<span className="brand-muted"> TIMER</span></span>
        </a>
        <div className="workspace-label">ESPACIO DE TRABAJO <ChevronDown size={13} /></div>
        <nav className="side-nav" aria-label="Navegación principal">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-link ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{id === 'studio' && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="streak-card">
          <div className="streak-icon"><Flame size={16} fill="currentColor" /></div>
          <div><div className="streak-number">{streak} día{streak === 1 ? '' : 's'}</div><div className="streak-copy">Tu racha de Focus</div></div>
          <Sparkles size={14} className="streak-sparkle" />
        </div>
        <div className="profile-row"><div className="avatar"><Clock3 size={16} /></div><div className="profile-copy"><strong>Tu espacio</strong><span>Guardado en este navegador</span></div></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>Espacio de trabajo</span><span className="crumb-slash">/</span><strong>{view === 'studio' ? 'Temporizador' : view === 'history' ? 'Historial' : view === 'settings' ? 'Ajustes' : 'Cómo funciona'}</strong></div>
        </header>

        {view === 'studio' && <div className="page-content">
          <section className="page-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> UN POMODORO A LA VEZ</div><h1>Hazle espacio a <em>lo que importa.</em></h1><p>Un bloque de Focus para avanzar en una tarea. Después, una pausa para volver con energía.</p></div>
            <div className="date-chip"><span className="date-dot" />{new Intl.DateTimeFormat('es', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date())}</div>
          </section>

          <section className="workspace-grid">
            <article className={`panel timer-panel mode-${modeColor}`}>
              <div className="panel-head"><div><div className="panel-kicker"><span className="signal-pulse" /> SESIÓN ACTUAL</div><h2>Una cosa <span>a la vez.</span></h2></div><button className="icon-button subtle-button" aria-label="Ajustes del temporizador" onClick={() => setView('settings')}><Settings2 size={17} /></button></div>
              <div className="timer-layout">
                <div className="timer-orbit" style={{ '--progress': `${Math.min(100, Math.max(0, 100 - (remaining / (durationFor(timer.mode, settings) * 60)) * 100))}%` } as React.CSSProperties}>
                  <div className="orbit-track" /><div className="orbit-progress" />
                  <div className="timer-face"><div className="timer-mode">{modeLabel(timer.mode).toUpperCase()}</div><div className="timer-value">{formatTime(remaining)}</div>{activeTask && <div className="timer-task"><span className="task-bullet" />{activeTask.title}</div>}</div>
                  <div className="orbit-marker" />
                </div>
                <div className="timer-side">
                  <div className="cycle-label">CICLO ACTUAL</div>
                  <div className="cycle-dots">{Array.from({ length: settings.cyclesBeforeLongBreak }, (_, index) => <span key={index} className={index < timer.completedFocusCount % settings.cyclesBeforeLongBreak ? 'filled' : ''} />)}</div>
                  <div className="cycle-caption">{timer.completedFocusCount % settings.cyclesBeforeLongBreak} de {settings.cyclesBeforeLongBreak} sesiones</div>
                  <div className="timer-divider" />
                  <div className="next-up"><span className="next-icon"><Coffee size={14} /></span><div><span>SIGUIENTE</span><strong>{timer.mode === 'focus' ? (timer.completedFocusCount + 1) % settings.cyclesBeforeLongBreak === 0 ? 'Descanso largo' : 'Descanso corto' : 'Sesión de Focus'}</strong></div></div>
              <div className="timer-note"><Sparkles size={13} /> Un Pomodoro cada vez.</div>
                </div>
              </div>
              <div className="timer-controls">
                <button className="primary-button" onClick={timer.running ? pauseTimer : startTimer}>{timer.running ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}<span>{timer.running ? 'Pausar sesión' : 'Empezar a concentrarme'}</span><span className="button-shortcut"><Command size={11} /><CornerDownLeft size={12} /></span></button>
                <button className="control-button" onClick={resetTimer} aria-label="Reiniciar temporizador"><RotateCcw size={17} /></button>
                <button className="control-button" onClick={skipTimer} aria-label="Saltar a la siguiente sesión"><SkipForward size={17} /></button>
              </div>
              <div className="timer-footer"><span><Volume2 size={14} className="footer-sound-icon" />{settings.soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}</span><button onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}>{settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}<span>{settings.soundEnabled ? 'Silenciar' : 'Activar sonido'}</span></button><span className="footer-divider" /><span>{settings.focusMinutes} min de Focus</span></div>
            </article>

            <article className="panel tasks-panel">
              <div className="panel-head task-head"><div><div className="panel-kicker"><span className="kicker-square"><ListTodo size={11} /></span> TUS PENDIENTES</div><h2>¿Qué tienes pendiente hoy? <span className="count-pill">{tasks.filter((task) => !task.done).length}</span></h2></div>{tasks.length > 0 && <button className="text-link" onClick={() => setShowAllTasks((value) => !value)}>{showAllTasks ? 'Ver menos' : 'Ver todas'} <ArrowRight size={13} /></button>}</div>
              <form className="task-input-row" onSubmit={addTask}><Plus size={17} /><input ref={taskInputRef} value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} placeholder="Añade algo que quieras hacer..." aria-label="Nueva tarea" /><button type="submit" disabled={!taskDraft.trim()} aria-label="Añadir tarea"><ArrowRight size={16} /></button></form>
              <div className="task-list">
                {shownTasks.length === 0 ? <div className="empty-tasks"><div className="empty-icon"><ListTodo size={18} /></div><strong>{tasks.length ? '¡Todo al día!' : 'Empieza con una tarea.'}</strong><span>{tasks.length ? 'Añade otra cuando quieras.' : 'Anota aquí lo que quieras sacar adelante. Después elegimos un primer paso.'}</span>{!tasks.length && <button className="empty-task-cta" onClick={() => taskInputRef.current?.focus()}>Escribir mi primera tarea <ArrowRight size={14} /></button>}</div> : shownTasks.map((task) => (
                  <div className={`task-item ${task.done ? 'is-done' : ''} ${activeTaskId === task.id ? 'is-active' : ''} ${celebratingTaskId === task.id ? 'just-completed' : ''}`} key={task.id}>
                    <div className="task-copy">
                      {editingId === task.id ? <input autoFocus value={editDraft} onChange={(event) => setEditDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveEdit(task.id); if (event.key === 'Escape') setEditingId(null) }} onBlur={() => saveEdit(task.id)} /> : <><span className="task-title">{task.title}</span><span className="task-subline">{task.done ? 'COMPLETADA' : activeTaskId === task.id ? 'VINCULADA AL FOCUS · OPCIONAL' : 'PENDIENTE'}</span><button className={`task-complete-button ${task.done ? 'is-complete' : ''}`} aria-label={task.done ? `Reabrir ${task.title}` : `Marcar ${task.title} como completada`} onClick={() => toggleTask(task)}>{celebratingTaskId === task.id ? <Sparkles size={15} /> : task.done ? <Check size={15} strokeWidth={3} /> : <CheckCircle2 size={15} />}<span>{celebratingTaskId === task.id ? '¡Muy bien!' : task.done ? 'Reabrir' : 'Completar'}</span></button></>}
                    </div>
                    <button className={`task-focus-button ${activeTaskId === task.id ? 'selected' : ''}`} disabled={task.done} aria-pressed={activeTaskId === task.id} aria-label={activeTaskId === task.id ? `Quitar ${task.title} del Focus` : `Vincular ${task.title} al temporizador`} title={activeTaskId === task.id ? 'Quitar del Focus' : 'Vincular al Focus'} onClick={() => setActiveTaskId((current) => current === task.id ? null : task.id)}><Clock3 size={16} /></button>
                    <div className="task-actions"><button aria-label={`Editar ${task.title}`} onClick={() => { setEditingId(task.id); setEditDraft(task.title) }}><MoreHorizontal size={16} /></button><button aria-label={`Eliminar ${task.title}`} onClick={() => { setTasks((current) => current.filter((item) => item.id !== task.id)); if (activeTaskId === task.id) setActiveTaskId(null) }}><X size={15} /></button></div>
                  </div>
                ))}
              </div>
              {tasks.length > 0 && <div className="task-panel-footer"><span><span className="tiny-check"><Check size={9} /></span> Todo avance cuenta.</span><span>{completedTasks}/{tasks.length} hechas</span></div>}
            </article>
          </section>

          <section className="bottom-grid">
            <article className="panel week-panel"><div className="panel-head compact-head"><div><div className="panel-kicker">PERSPECTIVA SEMANAL</div><h2>Tu concentración, <span>esta semana.</span></h2></div><button className="mini-select" onClick={() => setView('history')}>Últimos 7 días <ChevronDown size={13} /></button></div><div className="week-chart">{week.map((day) => <div className={`chart-day ${day.today ? 'hoy' : ''}`} key={day.key}><div className="bar-wrap"><div className="bar-tooltip">{day.minutes} min</div><div className={`bar ${day.today ? 'bar-today' : ''}`} style={{ height: `${Math.max(5, day.minutes / maxWeek * 100)}%` }} /></div><span className="chart-label">{day.label}</span></div>)}</div><div className="chart-legend"><span><Clock3 size={13} /> Minutos de Focus</span><span>{week.reduce((total, day) => total + day.minutes, 0)} min en total <ArrowDownRight size={13} /></span></div></article>
            <article className="panel ritual-panel"><div className="ritual-content"><div className="panel-kicker">UN RECORDATORIO PARA HOY</div><h2>Avanzar es<br /><em>cuestión de práctica.</em></h2><p>No necesitas un día perfecto. Basta con dar el primer paso y atender una tarea cada vez.</p><button onClick={() => setToast('Una sesión de Focus es un gran comienzo.')}>Volver al Focus <ArrowRight size={14} /></button></div><span className="ritual-tomato" aria-hidden="true" /></article>
          </section>

          <section className="metric-grid" aria-label="Estadísticas de Focus de hoy">
            <Metric icon={<Clock3 size={16} />} label="POMODOROS HOY" value={todayFocus.length.toString().padStart(2, '0')} detail="bloques completados" color="tomato" />
            <Metric icon={<BarChart3 size={16} />} label="TIEMPO DE FOCUS" value={`${todayMinutes}`} unit="min" detail={todayMinutes >= 60 ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m hoy` : 'hoy, minuto a minuto'} color="blue" />
            <Metric icon={<CheckCircle2 size={16} />} label="TAREAS COMPLETADAS" value={completedTasks.toString().padStart(2, '0')} detail={`${tasks.filter((task) => !task.done).length} por hacer`} color="mint" />
            <Metric icon={<Flame size={16} />} label="RACHA" value={streak.toString().padStart(2, '0')} unit="días" detail={streak ? 'sigue sumando' : 'hoy puede ser el primero'} color="orange" />
          </section>
          <section className="share-results panel" aria-label="Compartir resultados de hoy">
            <div className="share-results-icon"><Sparkles size={19} /></div>
            <div className="share-results-copy"><strong>Tu día, listo para compartir</strong><span>{todayFocus.length} sesiones · {todayMinutes} min en modo <em>Focus</em> · {todayCompletedTasks} tareas completadas</span></div>
            <div className="share-results-actions"><a className="share-whatsapp" href={`https://wa.me/?text=${encodeURIComponent(dailySummary)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> Compartir por WhatsApp</a><button className="share-copy" onClick={copyDailySummary}><Copy size={15} /> Copiar resumen</button></div>
          </section>
        </div>}

        {view === 'history' && <div className="page-content subpage"><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> TUS SESIONES ANTERIORES</div><h1>Mira cuánto <em>has avanzado.</em></h1><p>Cada minuto de concentración es una promesa cumplida.</p></div><div className="date-chip">{sessions.length} sesiones guardadas</div></section><div className="history-summary metric-grid"><Metric icon={<Clock3 size={16} />} label="SESIONES TOTALES" value={focusSessions.length.toString().padStart(2, '0')} detail="sesiones de Focus" color="tomato" /><Metric icon={<BarChart3 size={16} />} label="FOCUS ACUMULADO" value={`${focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0)}`} unit="min" detail="sumando todas las sesiones" color="blue" /><Metric icon={<Flame size={16} />} label="RACHA ACTUAL" value={streak.toString().padStart(2, '0')} unit="días" detail="racha actual" color="orange" /></div><section className="achievement-grid"><Achievement icon={<Award size={17} />} title="Primer impulso" description="Completa tu primera sesión de Focus." unlocked={focusSessions.length >= 1} /><Achievement icon={<Trophy size={17} />} title="Encontrar el ritmo" description="Completa 10 sesiones de Focus." unlocked={focusSessions.length >= 10} /><Achievement icon={<RotateCcw size={17} />} title="Volver a empezar" description="Mantén una racha de 5 días." unlocked={streak >= 5} /></section><article className="panel history-panel"><div className="panel-head"><div><div className="panel-kicker">TU HISTORIAL DE SESIONES</div><h2>Historial</h2></div><span className="count-pill">{sessions.length}</span></div>{sessions.length === 0 ? <div className="history-empty"><div className="empty-icon"><History size={19} /></div><strong>Tu historia empieza con una sesión.</strong><span>Aquí aparecerán tus sesiones de Focus y descanso.</span><button className="text-link" onClick={() => setView('studio')}>Ir al temporizador <ArrowRight size={13} /></button></div> : <div className="history-list">{sessions.map((session) => <div className="history-row" key={session.id}><div className={`history-mode-icon ${session.mode}`}><Clock3 size={16} /></div><div className="history-main"><strong>{modeLabel(session.mode)}</strong><span>{session.taskTitle}</span></div><div className="history-duration">{session.durationMinutes} min</div><div className="history-date">{new Intl.DateTimeFormat('es', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(session.completedAt)}</div></div>)}</div>}</article></div>}

        {view === 'guide' && <div className="page-content subpage guide-page">
          <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> GUÍA RÁPIDA</div><h1>El método <em>Pomodoro.</em></h1><p>Una tarea, un temporizador y pausas a tiempo. Aquí tienes lo esencial para empezar a concentrarte de verdad.</p></div></section>
          <div className="guide-origin panel"><span className="guide-tomato" aria-hidden="true" /><p>La técnica Pomodoro fue creada por <strong>Francesco Cirillo</strong> a finales de los años 80. <em>Pomodoro</em> significa «tomate» en italiano: el nombre viene del temporizador de cocina con esa forma que usaba cuando era estudiante.</p></div>

          <section className="guide-block" aria-labelledby="guide-cycle-title">
            <div className="guide-section-heading"><div><div className="panel-kicker">EL MÉTODO CLÁSICO</div><h2 id="guide-cycle-title">Un ciclo sencillo, paso a paso.</h2></div><span className="guide-cycle-mark"><RotateCcw size={17} /></span></div>
            <ol className="guide-steps guide-steps-five">
              <li className="panel guide-step"><span className="guide-step-icon"><ListTodo size={18} /></span><div><span className="guide-step-number">01 · PREPARA</span><h3>Elige una tarea</h3><p>Decide qué quieres avanzar antes de iniciar el temporizador.</p></div></li>
              <li className="panel guide-step"><span className="guide-step-icon"><Clock3 size={18} /></span><div><span className="guide-step-number">02 · CONCÉNTRATE</span><h3>Trabaja 25 minutos</h3><p>Dedícate a una sola tarea y deja las distracciones para después.</p><span className="guide-duration">25 min · 1 Pomodoro</span></div></li>
              <li className="panel guide-step"><span className="guide-step-icon mint"><Coffee size={18} /></span><div><span className="guide-step-number">03 · DESCANSA</span><h3>Para durante 5 minutos</h3><p>Levántate, bebe agua o estira antes de volver a empezar.</p><span className="guide-duration mint">5 min</span></div></li>
              <li className="panel guide-step"><span className="guide-step-icon"><RotateCcw size={18} /></span><div><span className="guide-step-number">04 · REPITE</span><h3>Completa cuatro Pomodoros</h3><p>Cada bloque de trabajo cuenta como un Pomodoro.</p><span className="guide-duration">4 sesiones de Focus</span></div></li>
              <li className="panel guide-step guide-step-long"><span className="guide-step-icon amber"><Coffee size={18} /></span><div><span className="guide-step-number">05 · RECARGA</span><h3>Tómate una pausa larga</h3><p>Después de cuatro Pomodoros, descansa entre 15 y 30 minutos y comienza un nuevo ciclo.</p><span className="guide-duration amber">15–30 min</span></div></li>
            </ol>
          </section>

          <section className="guide-block" aria-labelledby="guide-benefits-title">
            <div className="guide-section-heading"><div><div className="panel-kicker">POR QUÉ PUEDE AYUDARTE</div><h2 id="guide-benefits-title">Menos cuesta arriba. Más presente.</h2></div></div>
            <div className="guide-benefits">
              <article className="panel guide-benefit"><span className="guide-benefit-icon"><Target size={17} /></span><h3>Facilita concentrarte</h3><p>Un tramo corto y definido hace más sencillo empezar y dejar las distracciones para después.</p></article>
              <article className="panel guide-benefit"><span className="guide-benefit-icon mint"><Brain size={17} /></span><h3>Da espacio para recuperar</h3><p>Las pausas frecuentes ayudan a soltar la tarea antes de volver con atención renovada.</p></article>
              <article className="panel guide-benefit"><span className="guide-benefit-icon amber"><Hourglass size={17} /></span><h3>Te enseña cómo usas tu tiempo</h3><p>Cuenta tus sesiones y descubre cuánto Focus suelen necesitar tus tareas.</p></article>
              <article className="panel guide-benefit"><span className="guide-benefit-icon blue"><CheckCircle2 size={17} /></span><h3>Hace fácil dar el primer paso</h3><p>No tienes que pensar en toda la tarde: solo comprometerte con los próximos 25 minutos.</p></article>
            </div>
          </section>

          <div className="guide-practice-grid">
            <article className="panel guide-practice guide-focus-rule"><div className="panel-kicker">DURANTE UN POMODORO</div><h2>Una tarea. Un temporizador.<br /><em>Cero distracciones.</em></h2><p>Si recuerdas algo pendiente, apúntalo y continúa. Si aparece un aviso, déjalo para después. La meta no es correr: es prestar atención de verdad.</p></article>
            <article className="panel guide-practice guide-break-tips"><div className="panel-kicker">DURANTE EL DESCANSO</div><h2>Desconecta un momento.</h2><p>Una pausa funciona mejor cuando te alejas un poco de la tarea.</p><ul><li>Levántate y estira.</li><li>Bebe agua o da unos pasos.</li><li>Mira por la ventana y descansa la vista.</li></ul><small>Si puedes, deja las redes para después de la sesión.</small></article>
          </div>

          <section className="guide-block guide-flexible" aria-labelledby="guide-flex-title">
            <div className="guide-flex-copy"><div className="panel-kicker">ENCUENTRA TU RITMO</div><h2 id="guide-flex-title">¿Siempre tienen que ser 25 minutos?</h2><p>No. <strong>25 + 5</strong> es el formato clásico, pero puedes adaptar el trabajo y los descansos a tu energía y a lo que estés haciendo. Lo importante es mantener una estructura clara.</p><button className="guide-cta" onClick={() => setView('settings')}>Personalizar en Ajustes <ArrowRight size={15} /></button></div>
            <div className="guide-presets" aria-label="Ejemplos de intervalos"><div><strong>15 <span>+</span> 3</strong><small>Para arrancar con poca energía</small></div><div className="is-classic"><strong>25 <span>+</span> 5</strong><small>El Pomodoro clásico</small></div><div><strong>45 <span>+</span> 10</strong><small>Estudio más profundo</small></div><div><strong>50 <span>+</span> 10</strong><small>Creatividad y programación</small></div><div><strong>90 <span>+</span> 20</strong><small>Tareas de mucha concentración</small></div></div>
          </section>

          <aside className="guide-last-tip"><span><Sparkles size={15} /></span><p><strong>Un último consejo</strong><br />No intentes completar veinte Pomodoros el primer día. Empieza con uno. <em>25 minutos de concentración completa ya son un gran comienzo.</em></p><button onClick={() => setView('studio')}>Probar un Pomodoro <ArrowRight size={15} /></button></aside>
        </div>}

        {view === 'settings' && <div className="page-content subpage"><section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> A TU MANERA</div><h1>Encuentra tu propio <em>ritmo.</em></h1><p>Pequeños ajustes pueden ayudarte a concentrarte mejor.</p></div></section><div className="settings-grid"><article className="panel settings-panel"><div className="settings-section-heading"><div className="setting-icon"><AlarmClock size={17} /></div><div><h2>Ritmo de las sesiones</h2><p>Ajusta los tiempos a tu gusto.</p></div></div><div className="setting-rows"><DurationSetting label="Sesión de Focus" value={settings.focusMinutes} min={1} max={90} onChange={(value) => setSettings({ ...settings, focusMinutes: value })} /><DurationSetting label="Descanso corto" value={settings.shortBreakMinutes} min={1} max={30} onChange={(value) => setSettings({ ...settings, shortBreakMinutes: value })} /><DurationSetting label="Descanso largo" value={settings.longBreakMinutes} min={1} max={60} onChange={(value) => setSettings({ ...settings, longBreakMinutes: value })} /><DurationSetting label="Sesiones antes del descanso largo" value={settings.cyclesBeforeLongBreak} min={2} max={8} unit=" sesiones" onChange={(value) => setSettings({ ...settings, cyclesBeforeLongBreak: value })} /></div></article><article className="panel settings-panel"><div className="settings-section-heading"><div className="setting-icon"><Volume2 size={17} /></div><div><h2>Avisos suaves</h2><p>Recordatorios discretos al terminar una sesión.</p></div></div><div className="setting-rows"><div className="setting-row"><div><strong>Aviso sonoro</strong><span>Una campanada suave al terminar.</span></div><Toggle checked={settings.soundEnabled} onChange={(checked) => setSettings({ ...settings, soundEnabled: checked })} label="Aviso sonoro" /></div>{settings.soundEnabled && <div className="setting-row volume-row"><div><strong>Volumen</strong></div><input aria-label="Volumen del sonido" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(event) => setSettings({ ...settings, volume: Number(event.target.value) })} /></div>}<div className="setting-row"><div><strong>Notificaciones del navegador</strong><span>Recibe un aviso cuando termine una sesión.</span></div><Toggle checked={settings.notifications} onChange={(checked) => void toggleNotifications(checked)} label="Notificaciones del navegador" /></div><div className="setting-row"><div><strong>Iniciar automáticamente</strong><span>Empieza la siguiente parte del ciclo sin pausa.</span></div><Toggle checked={settings.autoStart} onChange={(checked) => setSettings({ ...settings, autoStart: checked })} label="Iniciar automáticamente" /></div></div></article><article className="panel settings-panel settings-about"><div className="settings-section-heading"><div className="setting-icon"><Sparkles size={17} /></div><div><h2>Tus datos son tuyos</h2><p>Pomodoro Timer guarda tu progreso en este navegador. Sin cuenta ni servidores.</p></div></div><button className="danger-link" onClick={() => { if (window.confirm('¿Borrar todos los datos de Pomodoro Timer guardados en este navegador? Esta acción no se puede deshacer.')) { ['pomogoblin-settings', 'pomogoblin-tasks', 'pomogoblin-sessions', 'pomogoblin-timer', 'pomogoblin-active-task'].forEach((key) => localStorage.removeItem(key)); window.location.reload() } }}>Borrar datos locales <ArrowRight size={14} /></button></article></div></div>}
      </main>

      <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={19} /><span>{label === 'Temporizador' ? 'Focus' : label === 'Historial' ? 'Historial' : label === 'Ajustes' ? 'Ajustes' : 'Guía'}</span></button>)}</nav>
      {toast && <div className="toast" role="status"><Sparkles size={15} />{toast}<button onClick={() => setToast('')} aria-label="Cerrar aviso"><X size={14} /></button></div>}
    </div>
  )
}

function Metric({ icon, label, value, unit, detail, color }: { icon: React.ReactNode; label: string; value: string; unit?: string; detail: string; color: string }) {
  return <article className="metric-card"><div className={`metric-icon ${color}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}<span>{unit}</span></div><div className="metric-detail">{detail}</div><span className={`metric-glow ${color}`} /></article>
}

function DurationSetting({ label, value, min, max, unit = ' min', onChange }: { label: string; value: number; min: number; max: number; unit?: string; onChange: (value: number) => void }) {
  return <div className="setting-row duration-row"><div><strong>{label}</strong><span>{value}{unit}</span></div><div className="stepper"><button onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Reducir ${label}`}><Minus size={13} /></button><div>{value}<small>{unit === ' min' ? 'min' : ''}</small></div><button onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Aumentar ${label}`}><Plus size={13} /></button></div></div>
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return <button className={`toggle ${checked ? 'on' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>
}

function Achievement({ icon, title, description, unlocked }: { icon: React.ReactNode; title: string; description: string; unlocked: boolean }) {
  return <article className={`panel achievement-card ${unlocked ? 'unlocked' : ''}`}><div className="achievement-icon" aria-hidden="true">{icon}</div><div className="achievement-copy"><strong>{title}</strong><span>{description}</span></div><span className="achievement-state">{unlocked ? 'DESBLOQUEADO' : 'POR DESBLOQUEAR'}</span></article>
}

export default App

