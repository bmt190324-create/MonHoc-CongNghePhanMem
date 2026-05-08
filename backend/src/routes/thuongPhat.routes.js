const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/thuongPhat.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');

router.get('/', auth, requireRole('CST', 'QLC'), ctrl.getAll);
router.post('/', auth, requireRole('CST'), auditLog('THEM_THUONG_PHAT', 'ThuongPhat'), ctrl.create);
router.delete('/:id', auth, requireRole('CST'), auditLog('XOA_THUONG_PHAT', 'ThuongPhat'), ctrl.remove);

module.exports = router;
