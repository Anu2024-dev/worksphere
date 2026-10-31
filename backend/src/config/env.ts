import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const fallbackSecret = 'worksphere-super-secure-jwt-secret-key-2026';

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === fallbackSecret)) {
  console.warn(
    '⚠️ [SECURITY WARNING] WorkSphere is running in production with an insecure or default JWT_SECRET. Generate an independent random 32+ character secret for JWT_SECRET.'
  );
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || fallbackSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
