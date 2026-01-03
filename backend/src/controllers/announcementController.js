const announcementService = require('../services/announcementService');
const { success, error } = require('../utils/responseHelpers');

/**
 * Create a new announcement
 * POST /api/announcements
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, expiresAt } = req.body;
    
    if (!title || !content) {
      return error(res, 'Title and content are required', 400);
    }
    
    const announcement = await announcementService.createAnnouncement(
      req.user.employeeId,
      { title, content, priority, expiresAt }
    );
    
    return success(res, announcement, 'Announcement created successfully', 201);
  } catch (err) {
    console.error('Create announcement error:', err);
    return error(res, 'Failed to create announcement');
  }
};

/**
 * Get active announcements (for all users)
 * GET /api/announcements
 */
const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await announcementService.getActiveAnnouncements();
    return success(res, announcements);
  } catch (err) {
    console.error('Get announcements error:', err);
    return error(res, 'Failed to fetch announcements');
  }
};

/**
 * Get all announcements (admin)
 * GET /api/announcements/all
 */
const getAllAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await announcementService.getAllAnnouncements(page, limit);
    return success(res, result);
  } catch (err) {
    console.error('Get all announcements error:', err);
    return error(res, 'Failed to fetch announcements');
  }
};

/**
 * Update an announcement
 * PUT /api/announcements/:id
 */
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await announcementService.updateAnnouncement(id, req.body);
    
    if (!announcement) {
      return error(res, 'Announcement not found', 404);
    }
    
    return success(res, announcement, 'Announcement updated successfully');
  } catch (err) {
    console.error('Update announcement error:', err);
    return error(res, 'Failed to update announcement');
  }
};

/**
 * Delete an announcement
 * DELETE /api/announcements/:id
 */
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await announcementService.deleteAnnouncement(id);
    return success(res, null, 'Announcement deleted successfully');
  } catch (err) {
    console.error('Delete announcement error:', err);
    return error(res, 'Failed to delete announcement');
  }
};

module.exports = {
  createAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  updateAnnouncement,
  deleteAnnouncement
};
