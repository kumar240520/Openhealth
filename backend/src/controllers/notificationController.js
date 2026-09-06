const { supabaseAdmin } = require('../config/supabase');

/**
 * Notifications Controller
 */
const notificationController = {
  // Get user notifications
  getNotifications: async (req, res, next) => {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit) || 10;

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const unreadCount = data ? data.filter(n => !n.read_at).length : 0;

      return res.status(200).json({
        success: true,
        data: {
          notifications: data || [],
          unreadCount
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Mark single notification as read
  markRead: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: { message: 'Notification ID is required.' }
        });
      }

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read.',
        data
      });
    } catch (err) {
      next(err);
    }
  },

  // Mark all user notifications as read
  markAllRead: async (req, res, next) => {
    try {
      const userId = req.userId;

      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        data: {
          updatedCount: data ? data.length : 0
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = notificationController;
