export const formatTime12Hour = (time) => {
  if (typeof time !== 'string') {
    return time
  }

  const match = /^(\d{1,2}):([0-5]\d)$/.exec(time)
  if (!match) {
    return time
  }

  const hour = Number(match[1])
  if (hour < 0 || hour > 23) {
    return time
  }

  const period = hour < 12 ? 'AM' : 'PM'
  return `${hour % 12 || 12}:${match[2]} ${period}`
}
