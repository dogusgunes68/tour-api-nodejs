const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');
const port = process.env.PORT || 3000;

dotenv.config({path : './config.env'})

const DB = process.env.DATABASE
           .replace('<PASSWORD>',process.env.DATABASE_PASSWORD);

mongoose.connect(DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
}).then(con =>{
    //console.log(con.connections);
    console.log("connection successfull");
});


//console.log(process.env);

app.listen(port,()=>{
    console.log("Server running at http://127.0.0.1:"+port);
});