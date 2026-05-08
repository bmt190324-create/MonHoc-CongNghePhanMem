const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dangKyCa.controller');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/khung-ca', auth, ctrl.getKhungCa);
router.put('/khung-ca/:id', auth, requireRole('CST', 'QLC'), ctrl.updateKhungCa);

router.get('/cua-toi', auth, requireRole('NV', 'QLC', 'CST'), ctrl.cuaToi);
router.get('/cho-duyet', auth, requireRole('QLC', 'CST'), ctrl.choDuyet);
router.post('/', auth, requireRole('NV'), ctrl.create);
router.post('/batch', auth, requireRole('NV'), ctrl.createBatch);
router.put('/:id/duyet', auth, requireRole('QLC', 'CST'), ctrl.duyet);
router.delete('/:id', auth, requireRole('NV'), ctrl.remove);

module.exports = router;
