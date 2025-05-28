const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { extracttext } = require('../utils/pdfExtract');
const ResumeAnalysis = require('../models/Resume');
//const { calculateSemanticSimilarity } = require('../utils/embeddingSimilarity');

const {
  TFIDFCalculation,  // updated to use TFIDFCalculation
  matchingKeywords,
  similarityCalc,
  recommendationGenerate
} = require('../utils/textAnalyse');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const Upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'), false);
    }
  }
});

router.post(
  '/upload',
  Upload.fields([{ name: 'resume', maxCount: 1 }, { name: 'jobDescription', maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!req.files || !req.files.resume) {
        return res.status(400).json({ message: 'Please upload the resume file.' });
      }

      const resumeFile = req.files.resume[0];
      const resumePath = resumeFile.path;

      let jobDescText = '';
      if (req.files.jobDescription && req.files.jobDescription[0]) {
        const jobDescFile = req.files.jobDescription[0];
        const jobDescPath = jobDescFile.path;

        jobDescText = jobDescFile.mimetype === 'application/pdf'
          ? await extracttext(jobDescPath)
          : fs.readFileSync(jobDescPath, 'utf8');
      } else if (req.body.jobDescriptionText) {
        jobDescText = req.body.jobDescriptionText;
      } else {
        return res.status(400).json({ message: 'Job description is required (as file or text).' });
      }

      const resumeText = await extracttext(resumePath);
      const similarityscore = await similarityCalc(resumeText, jobDescText);

      // Use TF-IDF calculation for keywords (pass both docs for context)
      const documents = [resumeText, jobDescText];
      const resumekeyword = TFIDFCalculation(resumeText, documents).slice(0, 50) || [];
      const jobkeyword = TFIDFCalculation(jobDescText, documents).slice(0, 50) || [];

      const keywordanalysis = matchingKeywords(resumekeyword, jobkeyword);
      const recommendation = recommendationGenerate(keywordanalysis, resumekeyword);

      const resumeAnalysis = new ResumeAnalysis({
        orignalResume: {
          fileName: resumeFile.originalname,
          filePath: resumePath,
          text: resumeText
        },
        jobDescription: {
          fileName: req.files.jobDescription?.[0]?.originalname || 'Text Submission',
          filePath: req.files.jobDescription?.[0]?.path || 'N/A',
          text: jobDescText
        },
        analysis: {
          matchScore: recommendation?.score || 0,
          resumekeyword: resumekeyword.slice(0, 50),
          jobkeyword: jobkeyword.slice(0, 50),
          matchingKeywords: keywordanalysis?.match || [],
          missingKeywords: (keywordanalysis?.miss || []).map(k => ({
            word: k.word,
            frequency: k.frequency,
            imp: 1
          })),
          recommendation: {
            additions: recommendation?.additions || [],
            removal: recommendation?.removal || [],
            recommendedMissing: recommendation?.recommendedMissing || [],
            feedback: recommendation?.feedback || ''
          }
        }
      });

      const saveanalysis = await resumeAnalysis.save();

      res.status(200).json({
        success: true,
        message: 'file processed completely',
        analysisId: saveanalysis._id,
        result: {
          matchScore: recommendation?.score || 0,
          totalResumekey: resumekeyword.length,
          totaljobkey: jobkeyword.length,
          matchkey: keywordanalysis?.matchcount || 0,
          feedback: recommendation?.feedback || '',
          additions: (recommendation?.additions || []).slice(0, 15),
          removal: recommendation?.removal || [],
          topresumekey: resumekeyword.slice(0, 15).map(k => k.word),
          topjobkey: jobkeyword.slice(0, 15).map(k => k.word),
          similarityscore: (similarityscore * 100).toFixed(2),
          recommendedMissing: recommendation?.recommendedMissing.slice(0, 15)
        }
      });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;
