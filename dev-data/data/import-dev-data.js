const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('./../../models/tourModel');
const dotenv = require('dotenv');

dotenv.config({path : `./config.env`});
const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD);


mongoose.connect(DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(con =>{
    console.log('Connected to MongoDB...');
});

const tours = JSON
.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf8'));

const importData = async() =>{
    try{
        await Tour.create(tours);
        console.log('Data successfully created');
    }catch(err){
        console.error(err);
    }
    process.exit();
}

const deleteAllTour = async() =>{
    try{
        await Tour.deleteMany();
        console.log('Successfully deleted all tours');
    }catch(err){
        console.error(err);
    }
    process.exit();
}

console.log(process.argv);

if(process.argv[2] === '--import'){
    importData();
}else if(process.argv[2] === '--delete'){
    deleteAllTour();
}