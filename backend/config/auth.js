export const authCookieName = 'medd_session'

export const getJwtSecret = () => {
  const { JWT_SECRET } = process.env

  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.')
  }

  return JWT_SECRET
}
