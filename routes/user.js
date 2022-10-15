const express = require('express');
const fs = require('fs');
const userController = require('./../controllers/user');
const authController = require('../controllers/auth');

const router = express.Router();
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.put(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);

router.put('/updateMe', authController.protect, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router.post('/forgotPassword', authController.forgotPassword);
router.put('/resetPassword/:token', authController.resetPassword);
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/:id').get(userController.getUser);
//.put(userController.updateUser)
//.delete(userController.deleteUser);

module.exports = router;
