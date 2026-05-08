const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/nhanVien.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const auditLog = require('../middleware/auditLog');

router.get('/', auth, requireRole('CST', 'QLC'), ctrl.getAll);
router.get('/me/thu-nhap', auth, ctrl.getMyIncome);
router.get('/me/next-shift', auth, ctrl.getNextShift);
router.get('/me/profile', auth, ctrl.getProfile);
router.put('/me/profile', auth, ctrl.updateProfile);
router.get('/me/finance', auth, ctrl.getFinance);
router.get('/:id', auth, requireRole('CST', 'QLC'), ctrl.getById);
router.post('/', auth, requireRole('CST'), auditLog('THEM_NHAN_VIEN', 'NhanVien'), ctrl.create);
router.put('/:id', auth, requireRole('CST'), auditLog('SUA_NHAN_VIEN', 'NhanVien'), ctrl.update);
router.delete('/:id', auth, requireRole('CST'), auditLog('XOA_NHAN_VIEN', 'NhanVien'), ctrl.remove);
router.patch('/:id/restore', auth, requireRole('CST'), auditLog('PHUC_HOI_NHAN_VIEN', 'NhanVien'), ctrl.restore);

module.exports = router;
