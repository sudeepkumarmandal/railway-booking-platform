const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'bharatrail_secret_2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      walletBalance: 5000 // Welcome bonus
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          walletBalance: user.walletBalance,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add money to Rail Wallet
// @route   POST /api/users/wallet/add
exports.addWalletFunds = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    user.walletBalance += num;
    await user.save();

    res.status(200).json({
      success: true,
      message: `₹${num} added to wallet successfully`,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
