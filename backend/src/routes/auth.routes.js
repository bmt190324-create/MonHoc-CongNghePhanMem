const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateRequired } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

router.post('/login', validateRequired(['ten_dang_nhap', 'mat_khau']), asyncHandler(ctrl.login));
router.post('/logout', asyncHandler(ctrl.logout));
router.post('/refresh', asyncHandler(ctrl.refresh));
router.put('/doi-mat-khau', auth, validateRequired(['mat_khau_cu', 'mat_khau_moi']), asyncHandler(ctrl.doiMatKhau));
router.put('/mo-khoa/:nhanVienId', auth, requireRole('CST'), asyncHandler(ctrl.moKhoa));
router.put('/reset-password/:nhanVienId', auth, requireRole('CST'), asyncHandler(ctrl.datLaiMatKhau));
router.get('/tai-khoan-bi-khoa', auth, requireRole('CST'), asyncHandler(ctrl.getTaiKhoanBiKhoa));

module.exports = router;
