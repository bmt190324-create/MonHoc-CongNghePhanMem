const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/phanCongCa.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', auth, requireRole('QLC', 'CST'), ctrl.getByLich);
router.post('/', auth, requireRole('QLC', 'CST'), ctrl.create);
router.post('/tu-dang-ky', auth, requireRole('QLC', 'CST'), ctrl.phanCongTuDangKy);
router.delete('/:id', auth, requireRole('QLC', 'CST'), ctrl.remove);

module.exports = router;
