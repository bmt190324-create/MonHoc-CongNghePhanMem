const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/thongBao.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Mọi vai trò đều được xem
router.get('/', auth, ctrl.getAll);

// Chỉ QLC và CST được đăng và ghim thông báo
router.post('/', auth, requireRole('QLC', 'CST'), ctrl.create);
router.patch('/:id/pin', auth, requireRole('QLC', 'CST'), ctrl.togglePin);

module.exports = router;
