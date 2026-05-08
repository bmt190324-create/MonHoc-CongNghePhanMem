const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/cauHinhLuong.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');

router.get('/', auth, requireRole('CST'), ctrl.getAll);
router.post('/', auth, requireRole('CST'), auditLog('THEM_CAU_HINH_LUONG', 'CauHinhLuong'), ctrl.create);

module.exports = router;
