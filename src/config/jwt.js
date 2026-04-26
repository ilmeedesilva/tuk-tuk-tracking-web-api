import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

//Sign an access token containing user identity and role claims.
export const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'tuk-tuk-tracking-api',
    audience: 'tuk-tuk-client',
  });

//Sign a refresh token used to obtain new access tokens.
export const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'tuk-tuk-tracking-api',
    audience: 'tuk-tuk-client',
  });

//Verify an access token. Returns decoded payload or throws on invalid/expired.
export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'tuk-tuk-tracking-api',
    audience: 'tuk-tuk-client',
  });

//Verify a refresh token. Returns decoded payload or throws.
export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer: 'tuk-tuk-tracking-api',
    audience: 'tuk-tuk-client',
  });

export const TOKEN_EXPIRY = {
  access: ACCESS_TOKEN_EXPIRY,
  refresh: REFRESH_TOKEN_EXPIRY,
};
