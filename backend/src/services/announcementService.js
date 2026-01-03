const db = require('../config/database');

/**
 * Announcement Service - Manages company announcements
 */

// Create announcements table if not exists
const initTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      priority VARCHAR(20) DEFAULT 'normal',
      is_active BOOLEAN DEFAULT TRUE,
      created_by INTEGER REFERENCES users(employee_id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    )
  `);
};

// Initialize table on module load
initTable().catch(console.error);

/**
 * Create a new announcement
 */
const createAnnouncement = async (userId, data) => {
  const { title, content, priority = 'normal', expiresAt } = data;
  
  const result = await db.query(
    `INSERT INTO announcements (title, content, priority, created_by, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, content, priority, userId, expiresAt || null]
  );
  
  return result.rows[0];
};

/**
 * Get all active announcements
 */
const getActiveAnnouncements = async () => {
  const result = await db.query(`
    SELECT 
      a.id,
      a.title,
      a.content,
      a.priority,
      a.created_at,
      a.expires_at,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM announcements a
    LEFT JOIN users u ON a.created_by = u.employee_id
    WHERE a.is_active = true 
      AND (a.expires_at IS NULL OR a.expires_at > NOW())
    ORDER BY 
      CASE WHEN a.priority = 'urgent' THEN 1 
           WHEN a.priority = 'important' THEN 2 
           ELSE 3 END,
      a.created_at DESC
    LIMIT 10
  `);
  
  return result.rows;
};

/**
 * Get all announcements (including inactive) for admin
 */
const getAllAnnouncements = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  
  const countResult = await db.query('SELECT COUNT(*) FROM announcements');
  const total = parseInt(countResult.rows[0].count);
  
  const result = await db.query(`
    SELECT 
      a.*,
      u.first_name || ' ' || u.last_name as created_by_name
    FROM announcements a
    LEFT JOIN users u ON a.created_by = u.employee_id
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);
  
  return {
    announcements: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update an announcement
 */
const updateAnnouncement = async (id, data) => {
  const { title, content, priority, isActive, expiresAt } = data;
  
  const result = await db.query(
    `UPDATE announcements 
     SET title = COALESCE($1, title),
         content = COALESCE($2, content),
         priority = COALESCE($3, priority),
         is_active = COALESCE($4, is_active),
         expires_at = $5
     WHERE id = $6
     RETURNING *`,
    [title, content, priority, isActive, expiresAt, id]
  );
  
  return result.rows[0];
};

/**
 * Delete an announcement
 */
const deleteAnnouncement = async (id) => {
  await db.query('DELETE FROM announcements WHERE id = $1', [id]);
  return true;
};

module.exports = {
  createAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
};
