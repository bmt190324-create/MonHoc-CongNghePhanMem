const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/thongKe.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/tong-quan', auth, requireRole('CST', 'QLC'), ctrl.tongQuan);
router.get('/chi-phi-luong', auth, requireRole('CST'), ctrl.chiPhiLuong);
router.get('/nhan-su-ca', auth, requireRole('CST', 'QLC'), ctrl.nhanSuCa);

module.exports = router;
