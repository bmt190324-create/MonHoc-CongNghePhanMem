const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bangLuong.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');

router.get('/', auth, requireRole('CST', 'NV'), ctrl.getAll);
router.post('/tinh-luong', auth, requireRole('CST'), auditLog('TINH_LUONG', 'BangLuong'), ctrl.tinhLuong);
router.put('/:id/trang-thai', auth, requireRole('CST'), auditLog('DUYET_LUONG', 'BangLuong'), ctrl.updateTrangThai);

module.exports = router;
