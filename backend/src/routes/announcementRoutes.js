const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get active announcements (all users)
router.get('/', announcementController.getActiveAnnouncements);

// Admin only routes
router.post('/', requireAdmin, announcementController.createAnnouncement);
router.get('/all', requireAdmin, announcementController.getAllAnnouncements);
router.put('/:id', requireAdmin, announcementController.updateAnnouncement);
router.delete('/:id', requireAdmin, announcementController.deleteAnnouncement);

module.exports = router;
