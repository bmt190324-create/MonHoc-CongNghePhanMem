const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/login', ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/refresh', ctrl.refresh);
router.put('/doi-mat-khau', auth, ctrl.doiMatKhau);
router.put('/mo-khoa/:nhanVienId', auth, requireRole('CST'), ctrl.moKhoa);
router.put('/reset-password/:nhanVienId', auth, requireRole('CST'), ctrl.datLaiMatKhau);
router.get('/tai-khoan-bi-khoa', auth, requireRole('CST'), ctrl.getTaiKhoanBiKhoa);

module.exports = router;
