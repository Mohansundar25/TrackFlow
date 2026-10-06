const router = require('express').Router();
const Task = require('../models/Task');
const requireAuth = require('../middleware/requireAuth');
const wrap = require('../middleware/asyncHandler');

const EDITABLE = ['title', 'description', 'status', 'priority', 'subtasks', 'aiGenerated'];
const pick = (body) => Object.fromEntries(Object.entries(body).filter(([k]) => EDITABLE.includes(k)));

router.use(requireAuth);

router.get('/', wrap(async (req, res) => {
  res.json(await Task.find({ user: req.userId }).sort({ createdAt: 1 }));
}));

router.post('/', wrap(async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ message: 'Title is required' });
  const task = await Task.create({ ...pick(req.body), user: req.userId });
  res.status(201).json(task);
}));

router.put('/:id', wrap(async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
}));

router.delete('/:id', wrap(async (req, res) => {
  const result = await Task.deleteOne({ _id: req.params.id, user: req.userId });
  if (!result.deletedCount) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Deleted' });
}));

module.exports = router;
