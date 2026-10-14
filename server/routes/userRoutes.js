const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  addWalletFunds
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/wallet/add', addWalletFunds);

module.exports = router;
