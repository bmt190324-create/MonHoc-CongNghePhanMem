const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chamCong.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');

router.get('/lich-ca-nhan', auth, ctrl.lichCaNhan);
router.get('/thu-nhap-du-kien', auth, requireRole('NV'), ctrl.thuNhapDuKien);
router.get('/theo-ca/:lich_id', auth, requireRole('QLC', 'CST'), ctrl.theoCa);
router.put('/:id', auth, requireRole('QLC', 'CST'), auditLog('CAP_NHAT_CHAM_CONG', 'ChamCong'), ctrl.update);

module.exports = router;
