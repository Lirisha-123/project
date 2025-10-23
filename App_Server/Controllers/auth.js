const User = require('../Models/user');
const bcrypt = require('bcryptjs');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    req.flash('error_msg', 'Please log in to view this resource');
    return res.redirect('/login');
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userId && req.session.role === 'admin') {
    return next();
  } else {
    req.flash('error_msg', 'Access denied. Admin privileges required.');
    return res.redirect('/dashboard');
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      req.session.role = user.role;
      req.session.name = user.name;
      req.flash('success_msg', 'You are now logged in');
      res.redirect('/dashboard');
    } else {
      req.flash('error_msg', 'Invalid email or password');
      res.redirect('/login');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'An error occurred during login');
    res.redirect('/login');
  }
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role, skills, interests, bio, experience } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      req.flash('error_msg', 'User already exists');
      return res.redirect('/register');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      skills: skills ? skills.split(',').map(s => s.trim()) : [],
      interests: interests ? interests.split(',').map(i => i.trim()) : [],
      bio,
      experience: role === 'mentor' ? experience : undefined
    });

    if (user) {
      req.session.userId = user._id;
      req.session.role = user.role;
      req.session.name = user.name;
      req.flash('success_msg', 'Registration successful');
      res.redirect('/dashboard');
    } else {
      req.flash('error_msg', 'Invalid user data');
      res.redirect('/register');
    }
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/register');
  }
};

// Logout user
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/');
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  login,
  register,
  logout
};
