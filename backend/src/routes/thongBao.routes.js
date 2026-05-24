const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/thongBao.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateRequired } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

// Mọi vai trò đều được xem
router.get('/', auth, asyncHandler(ctrl.getAll));

// Chỉ QLC và CST được đăng và ghim thông báo
router.post('/', auth, requireRole('QLC', 'CST'), validateRequired(['tieu_de', 'noi_dung']), asyncHandler(ctrl.create));
router.patch('/:id/pin', auth, requireRole('QLC', 'CST'), asyncHandler(ctrl.togglePin));

module.exports = router;
