const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tuanLamViec.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, requireRole('CST', 'QLC'), ctrl.create);
router.put('/:id/trang-thai', auth, requireRole('CST', 'QLC'), ctrl.updateTrangThai);
router.put('/:id/deadline', auth, requireRole('CST', 'QLC'), ctrl.updateDeadline);


module.exports = router;
