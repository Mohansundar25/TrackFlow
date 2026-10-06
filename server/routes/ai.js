const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const wrap = require('../middleware/asyncHandler');
const { breakdownTask } = require('../services/ai');

router.use(requireAuth);

// POST /api/ai/breakdown { title, description? } -> { description, priority, subtasks[] }
router.post('/breakdown', wrap(async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
  res.json(await breakdownTask({ title: title.trim(), description }));
}));

module.exports = router;
