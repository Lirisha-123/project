const User = require('../Models/user');
const Match = require('../Models/match');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, 'your-secret-key', { expiresIn: '30d' });
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role, skills, interests, bio, experience } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      skills: skills || [],
      interests: interests || [],
      bio,
      experience: role === 'mentor' ? experience : undefined
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills,
        interests: user.interests,
        bio: user.bio,
        experience: user.experience
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.skills = req.body.skills || user.skills;
      user.interests = req.body.interests || user.interests;
      user.bio = req.body.bio || user.bio;
      if (user.role === 'mentor') {
        user.experience = req.body.experience || user.experience;
      }

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        skills: updatedUser.skills,
        interests: updatedUser.interests,
        bio: updatedUser.bio,
        experience: updatedUser.experience
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get potential matches
const getMatches = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let potentialMatches;
    if (user.role === 'mentee') {
      // Find mentors with matching skills
      potentialMatches = await User.find({
        role: 'mentor',
        skills: { $in: user.interests }
      });
    } else {
      // Find mentees interested in mentor's skills
      potentialMatches = await User.find({
        role: 'mentee',
        interests: { $in: user.skills }
      });
    }

    // Get existing matches to exclude them
    const existingMatches = await Match.find({
      $or: [
        { mentor: user._id },
        { mentee: user._id }
      ]
    }).select('mentor mentee');

    const matchedUserIds = existingMatches.map(match =>
      match.mentor.toString() === user._id.toString() ? match.mentee.toString() : match.mentor.toString()
    );

    // Filter out already matched users
    potentialMatches = potentialMatches.filter(match =>
      !matchedUserIds.includes(match._id.toString())
    );

    res.json(potentialMatches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create match request
const createMatch = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const user = await User.findById(req.user._id);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
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
      return res.status(400).json({ message: 'Match request already exists' });
    }

    // Create match
    const match = await Match.create({
      mentor: mentorId,
      mentee: menteeId,
      matchedSkills: user.role === 'mentee' ? user.interests.filter(skill => targetUser.skills.includes(skill)) : targetUser.interests.filter(skill => user.skills.includes(skill))
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getMatches,
  createMatch
};
