const router = require('express').Router();
const ctrl = require('../controllers/leaderboardController');

router.get('/', ctrl.getLeaderboard);

module.exports = router;
