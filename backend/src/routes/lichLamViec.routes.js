const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lichLamViec.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, requireRole('QLC', 'CST'), ctrl.create);
router.post('/tao-tu-dang-ky', auth, requireRole('QLC', 'CST'), ctrl.taoTuDangKy);

module.exports = router;
