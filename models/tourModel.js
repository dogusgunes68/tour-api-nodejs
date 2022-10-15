const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true,'A tour must have name'],
        unique : true,
        maxlength : [40,'max length must be 40 characters'],
        minlength : [5,'min length must be 5 characters'],
        validate : [validator.isAlpha,'Tour name must only contain characters that are alphanumeric']
    },
    slug: String,
    rating : {
        type : Number,
        default : 0.0,
    },
    price : {
        type : Number,
        required : [true,'A tour must have price'],

    },
    duration : {
        type : Number,
        required : [true,'A tour must have durations']
    },
    maxGroupSize : {
        type : Number,
        required : [true,'A tour must have maxgroup size']
    },
    difficulty : {
        type : String,
        required : [true,'A tour must have difficulty'],
        enum : {
            values : ['easy','medium','difficult'],
            message : 'Difficulty is either : easy, medium, difficult'
        }
    },
    ratingsAverage : {
        type : Number,
        default : 1,
        min : [1,'Rating must be above 1'],
        max : [5,'Rating must be below 5']
    },
    ratingsQuantity : {
        type : Number,
        default : 0
    },
    priceDiscount : {
        type : Number,
        validate : {
            validator : function(val){
                return val < this.price;//this only points to current doc on NEW document creation
            },
            message : 'Price discount ({VALUE}) must be below regular price'
        }
    },

    summary : {
        type : String,
        trim : true,
        required : [true,'A tour must have summary']
    },
    description : {
        type : String,
        trim : true
    },
    imageCover : {
        type : String,
        required : [true,'A tour must have imageCover']
    },
    images : [String],//an array
    createdAt : {
        type : Date,
        default : Date.now(),
        select : false
    },
    startDates : [Date],
    secretTour : {
        type : Boolean,
        default : false
    }

},{
    toJSON : {virtuals : true},
    toObject : {virtuals : true}
});

tourSchema.virtual('durationWeeks').get(function (){
    return this.duration / 7;
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save',function (next){
    this.slug = slugify(this.name, {lower : true});
    next();
});

/*
//after .save() and .create()
tourSchema.post('save',function (doc, next){
    console.log(doc);
    next();
});
*/

//QUERY MIDDLEWARE
tourSchema.pre(/^find/,function (next){//This function does that for all proccess starting with find proccess(ex:findOne))
    this.find({secretTour : {$ne:true}});
    next();
});

/*
tourSchema.post(/^find/,function(docs,next){
    console.log(docs);
    next();
});
*/


const Tour = mongoose.model('Tour',tourSchema);

module.exports = Tour;