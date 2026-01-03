require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'dayflow',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '226644',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dayflow-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
};
