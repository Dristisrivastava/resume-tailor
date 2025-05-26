const express=require('express');
const router=express.Router();
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const {extracttext}=require('../utils/pdfExtract');
const { error } = require('console');
const ResumeAnalysis =require('../models/Resume');
const {
    keywordExtract,
    matchingKeywords,
    similarityCalc,
    recommendationGenerate
} = require('../utils/textAnalyse');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the uploads folder
  },
  fileName: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Give each file a unique name
  }
});

const Upload=multer({
    storage:storage,
    limits:{ fileSize:10*1024*1024},
    fileFilter:(req,file,cb)=>{
        if(file.mimetype==='application/pdf' || file.mimetype==='text/plain'){
            cb(null,true);
        }else{
            cb(new Error('Only pdf and txt file allowed'),false);
        }
    }
});

router.post('/upload',Upload.fields([
    {name:'resume',maxCount:1},
    {name:'jobDescription',maxCount:1}
]),async(req,res)=>{
  try {
    if(!req.files || !req.files.resume || !req.files.jobDescription){
      return res.status(400).json({message: 'please upload all files properly'});
    }
    const resumeFile= req.files.resume[0];
    const jobDescFile= req.files.jobDescription[0];
    const resumePath = resumeFile.path;
    const jobDescPath = jobDescFile.path;

    console.log('processing files: ',resumeFile.originalname,jobDescFile.originalname);
    
    let resumeText,jobDescText;

    try {
      resumeText= await extracttext(resumePath); //as resume is always in pdf
      
      if(jobDescFile.mimetype=='application/pdf'){
        jobDescText=await extracttext(jobDescPath);
      }else{
        jobDescText=fs.readFileSync(jobDescPath,'utf8');
      }

      console.log('Text extraction complete');
      console.log('resume length ',resumeText.length);
      console.log('job description text length', jobDescText.length)
    } catch (error) {
      console.error('error in analysing the file', error);
      return res.status(500).json({message: 'unalble to analyse the file'});
    }

    //for text analysing

    try {
      console.log('starting text analysis');

      const resumekeyword= keywordExtract(resumeText);
      const jobkeyword = keywordExtract(jobDescText);

      console.log('resume keywords found ',resumekeyword.length);
      console.log('job description keywords found' ,jobkeyword.length);
      const keywordanalysis = matchingKeywords(resumekeyword,jobkeyword);
      const simarityscore = similarityCalc(resumeText,jobDescText);

      const reccomendation = recommendationGenerate(keywordanalysis);
      console.log('Analysis complete',reccomendation.score);

      const resumeAnalysis=new ResumeAnalysis({
        orignalResume:{
          fileName: resumeFile.originalname,
          filePath: resumePath,
          text: resumeText,
        },
        jobDescription:{
          fileName:jobDescFile.originalname,
          filePath:jobDescPath,
          text:jobDescText,
        },
        analysis:{
          matchScore:reccomendation.score,
          resumekeyword:resumekeyword.slice(0,50),
          jobkeyword: jobkeyword.slice(0,50),
          matchingKeywords: keywordanalysis.match,
          missingKeywords: keywordanalysis.miss.map(k => ({
            word:k.word,
            frequency:k.frequency,
            imp:1
          })),
          reccomendation:{
            Addition:reccomendation.Addition,
            removal:reccomendation.removal,
            feedback:reccomendation.feedback,
          }
        }
      });
      const saveanalysis = await resumeAnalysis.save();
      console.log('Analysis saved in database with ID ',saveanalysis._id);
      
      res.status(200).json({
        success:true,
        message:'file processed completly',
        analysisId:saveanalysis._id,
        result:{
          matchScore:reccomendation.score,
          totalResumekey:resumekeyword.length,
          totaljobkey: jobkeyword.length,
          matchkey:keywordanalysis.matchcount,
          feedback:reccomendation.feedback,
          Addition:reccomendation.Addition.slice(0,10),
          removal:reccomendation.removal,
          topresumekey: resumekeyword.slice(0,10).map(k => k.word),
          topjobkey:jobkeyword.slice(0,10).map(k => k.word),
          simarityscore:(simarityscore * 100).toFixed(2)
        }
    });
    }catch(error){
      console.error('error in analysing',error);
    return res.status(500).json({message:'error in analysis'}); 
    }
  } catch (error) {
    console.error('error in file upload',error);
    return res.status(500).json({ message: 'server error' , error : error.message});
  }
});
//if analysis with any id like 123abc is called
router.get('/analysis/:id',async(req,res) => {
  try {
    const analysis = await ResumeAnalysis.findById(req.params.id);
    if(!analysis){
      return res.status(404).json({message : 'Analysis not found'});
    }
    res.status(200).json({
      success:true,
      analysis:{
        id:analysis.id,
        createdAt:analysis.createdAt,
        matchScore:analysis.analysis.matchScore,
        reccomendation:analysis.analysis.reccomendation,
        resumekeyword:analysis.analysis.resumekeyword.slice(0,20),
        jobkeyword:analysis.analysis.jobkeyword.slice(0,20),
        matchingKeywords:analysis.analysis.matchingKeywords,
        missingKeywords:analysis.analysis.missingKeywords.slice(0,15)
      }
    });
  } catch (error) {
    console.error('Error fetching analysis ',error);
    res.status(500).json({message : 'server error',error : error.message});
  }
});
//for /analyses all the analyses history

router.get('/analyses',async (req,res) => {
  try {
    const analyses = await resumeAnalysis.find()
    .sort({createdAt:-1})
    .limit(10)
    .select('_id createdAt analysis.matchScore analysis.recommendation.overallFeedback originalResume.fileName jobDescription.fileName');
    res.status(200).json({
      success:true,
      analyses:analyses
    });
  } catch (error) {
    console.error('error fetching analyses',error);
    res.status(500).json({ Message :'server error',error:error.message});
  }
});

module.exports = router;