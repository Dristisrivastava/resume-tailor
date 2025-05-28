const express=require('express');
const cors=require('cors');
const multer=require('multer');
const path=require('path');
const mongoose=require('mongoose');
require('dotenv').config();

const resumeRoutes = require('./routes/resumeRoutes');

const app=express();
const PORT=process.env.PORT||5000;

app.use(cors());
app.use(express.json());

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'uploads/');
    },
    filename:function(req,file,cb){
        cb(null,Date.now()+path.extname(file.originalname));
    }
});

const upload=multer({storage:storage});


app.get('/',(req,res)=>{
    res.send('project is running');
});

app.post('/api/upload',
    upload.fields([
    {name:'resume',maxCount:1},
    {name:'jobDescription',maxCount:1}
]),(req,res)=>{
    try {
        if(!req.files || !req.files.resume || !req.files.jobDescription){
            return res.status(400).json({message:'upload all the files'});
        }

        res.status(200).json({ //200 means ok 
            message:'uploaded succesfully',
            resumepath:req.files.resume[0].path,
            jobDescriptionPath:req.files.jobDescription[0].path
        })
    } catch (error) {
        res.status(500).json({message:'server error',error:error.message});
    }
});

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

const fs=require('fs');
if(!fs.existsSync('./uploads')){
    fs.mkdirSync('./uploads');
}

app.listen(PORT, () => {
  console.log(`server is running at ${PORT}`);
});
