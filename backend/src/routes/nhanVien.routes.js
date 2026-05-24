const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/nhanVien.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');
const { validateRequired } = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

router.get('/', auth, requireRole('CST', 'QLC'), asyncHandler(ctrl.getAll));
router.get('/me/thu-nhap', auth, asyncHandler(ctrl.getMyIncome));
router.get('/me/next-shift', auth, asyncHandler(ctrl.getNextShift));
router.get('/me/profile', auth, asyncHandler(ctrl.getProfile));
router.put('/me/profile', auth, validateRequired(['ho_ten']), asyncHandler(ctrl.updateProfile));
router.get('/me/finance', auth, asyncHandler(ctrl.getFinance));
router.get('/:id', auth, requireRole('CST', 'QLC'), asyncHandler(ctrl.getById));
router.post('/', auth, requireRole('CST'), validateRequired(['ten_dang_nhap', 'mat_khau', 'ho_ten', 'vai_tro_id']), auditLog('THEM_NHAN_VIEN', 'NhanVien'), asyncHandler(ctrl.create));
router.put('/:id', auth, requireRole('CST'), auditLog('SUA_NHAN_VIEN', 'NhanVien'), asyncHandler(ctrl.update));
router.delete('/:id', auth, requireRole('CST'), auditLog('XOA_NHAN_VIEN', 'NhanVien'), asyncHandler(ctrl.remove));
router.patch('/:id/restore', auth, requireRole('CST'), auditLog('PHUC_HOI_NHAN_VIEN', 'NhanVien'), asyncHandler(ctrl.restore));

module.exports = router;
