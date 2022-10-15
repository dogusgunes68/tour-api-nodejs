const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Sending JWT via COOKIE
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //90 days
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV == 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  //

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  //1) check if email and password exist
  if (!email || !password) {
    return next(new Error('Please enter an email and password'));
  }

  //2) check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new Error('User does not exist or password is incorrect'));
  }
  //3) if everything is ok, send token to client
  createSendToken(user, 200, res);
};

exports.protect = async (req, res, next) => {
  //1) getting token and check of it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  //console.log(token);
  if (!token) {
    return next(new Error('Token is undifiend'));
  }

  //2) verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  if (!decoded) {
    return next(new Error('You are not logged in. Please log in to access'));
  }
  console.log(decoded);
  //3) check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new Error('The user belonging to this token is no longer exist.')
    );
  }

  //4) check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new Error('User recently changed password. Please log in again.')
    );
  }

  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
};

exports.restrictTo = (...roles) => {
  //roles => ['admin', 'lead-admin'] ;  role => user

  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new Error('You dont have permission to perform this action'));
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  try {
    //1) get user based on POSTed email
    const user = await User.findeOne({ email: req.user.email });
    if (!user) {
      return next(new Error('There is no user with email address'));
    }

    //2) genereate the random reset tokens

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: falses }); //given options to save method to deactive all validators in the schema

    //3) send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.
    \nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid 10 minutes)',
        message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.save({ validateBeforeSave: false });

      return next(
        new Error(
          'There was an error sending the email! Please try again later.'
        )
      );
    }
  } catch (err) {
    res.status(403).json({
      status: 'error',
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    //1) get user based on the token
    const hashedToken = crypto
      .createHashedToken('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //2) if token has not expired, and there is user, set the new password
    if (!user) {
      return next(new Error('The user doesnt exist or token has expired'));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    //3) update changePasswordAt property for the user
    //4) log the user in, send the JWT
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    //1) get user form collection
    const user = await User.findById(req.user.id).select('+password');

    //2) check if POSTed current password is correct
    if (!user.correctPassword(req.body.passwordCurrent, user.password)) {
      return next(new Error('Invalid password'));
    }
    //3) if so, update the password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    //User.findByIdAndUpdate will not work as intended!!!

    //4) log user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
  }
};
