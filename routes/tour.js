const express = require('express');
const tourController = require('./../controllers/tour');
const authController = require('./../controllers/auth');

const router = express.Router();

/*
router.param('id',(req,res,next,val)=>{
    console.log("id is :"+val);
    next();
}); 
*/

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/top-5-expensive')
  .get(tourController.aliasTopExpensiveTours, tourController.getAllTours);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour); //first middleware func works

router
  .route('/:id')
  .get(tourController.getTour)
  //.patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  )
  .put(tourController.updateTour);

module.exports = router;
