const aiRecommendationService = require('../services/ai/aiRecommendationService');

/**
 * Controller for AI Analyzer and Multi-Modal Recommendation Engine.
 */
const aiController = {
  /**
   * POST /api/v1/ai/recommend
   * Run multi-modal analysis (symptoms, voice, reports, bills).
   */
  analyzeAndRecommend: async (req, res, next) => {
    try {
      const { symptoms, voiceTranscript, reportIds, billIds } = req.body;
      const result = await aiRecommendationService.analyzeAndRecommend({
        userId: req.userId,
        symptoms,
        voiceTranscript,
        reportIds: reportIds || [],
        billIds: billIds || []
      });

      return res.status(200).json({
        success: true,
        data: result,
        message: 'AI multi-modal clinical recommendation generated successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/ai/sessions
   * Retrieve past AI assessment sessions.
   */
  getPastSessions: async (req, res, next) => {
    try {
      const sessions = await aiRecommendationService.getPastSessions(req.userId);
      return res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/ai/sessions/:id
   * Retrieve specific AI assessment session.
   */
  getSessionById: async (req, res, next) => {
    try {
      const session = await aiRecommendationService.getSessionById(req.userId, req.params.id);
      return res.status(200).json({
        success: true,
        data: session
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = aiController;
