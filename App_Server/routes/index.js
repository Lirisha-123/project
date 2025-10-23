const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, login, register, logout } = require('../Controllers/auth');
const User = require('../Models/user');
const Match = require('../Models/match');

/* Home page */
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Mentor Bridge - Connect Students and Alumni',
    user: req.session.userId ? { name: req.session.name, role: req.session.role } : null
  });
});

/* Authentication routes */
router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('login', {
    title: 'Login - Mentor Bridge',
    user: null,
    success_msg: req.flash('success_msg'),
    error_msg: req.flash('error_msg')
  });
});

router.post('/login', login);

router.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('register', { title: 'Register - Mentor Bridge' });
});

router.post('/register', register);

router.get('/logout', logout);

/* Protected routes */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/login');
    }

    let matches = [];
    let potentialMatches = [];

    if (user.role === 'mentee') {
      // Find mentors with matching skills
      potentialMatches = await User.find({
        role: 'mentor',
        skills: { $in: user.interests }
      }).limit(5);

      // Get existing matches
      matches = await Match.find({ mentee: user._id }).populate('mentor');
    } else if (user.role === 'mentor') {
      // Find mentees interested in mentor's skills
      potentialMatches = await User.find({
        role: 'mentee',
        interests: { $in: user.skills }
      }).limit(5);

      // Get existing matches
      matches = await Match.find({ mentor: user._id }).populate('mentee');
    } else if (user.role === 'admin') {
      // Admin sees all users and matches
      const allUsers = await User.find({});
      const allMatches = await Match.find({}).populate('mentor').populate('mentee');
      return res.render('admin', {
        title: 'Admin Dashboard - Mentor Bridge',
        user,
        allUsers,
        allMatches
      });
    }

    res.render('dashboard', {
      title: 'Dashboard - Mentor Bridge',
      user,
      matches,
      potentialMatches
    });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'An error occurred loading the dashboard');
    res.redirect('/');
  }
});

router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/login');
    }
    res.render('profile', { title: 'Profile - Mentor Bridge', user });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'An error occurred loading your profile');
    res.redirect('/dashboard');
  }
});

router.post('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      req.flash('error_msg', 'User not found');
      return res.redirect('/login');
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.skills = req.body.skills ? req.body.skills.split(',').map(s => s.trim()) : user.skills;
    user.interests = req.body.interests ? req.body.interests.split(',').map(i => i.trim()) : user.interests;
    user.bio = req.body.bio || user.bio;
    if (user.role === 'mentor') {
      user.experience = req.body.experience || user.experience;
    }

    await user.save();
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'An error occurred updating your profile');
    res.redirect('/profile');
  }
});

router.post('/match/:id', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      req.flash('error_msg', 'Target user not found');
      return res.redirect('/dashboard');
    }

    // Determine mentor and mentee
    const mentorId = user.role === 'mentor' ? user._id : targetUser._id;
    const menteeId = user.role === 'mentee' ? user._id : targetUser._id;

    // Check if match already exists
    const existingMatch = await Match.findOne({
      mentor: mentorId,
      mentee: menteeId
    });

    if (existingMatch) {
      req.flash('error_msg', 'Match request already exists');
      return res.redirect('/dashboard');
    }

    // Create match
    await Match.create({
      mentor: mentorId,
      mentee: menteeId,
      matchedSkills: user.role === 'mentee' ? user.interests.filter(skill => targetUser.skills.includes(skill)) : targetUser.interests.filter(skill => user.skills.includes(skill))
    });

    req.flash('success_msg', 'Match request sent successfully');
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'An error occurred creating the match');
    res.redirect('/dashboard');
  }
});

module.exports = router;
