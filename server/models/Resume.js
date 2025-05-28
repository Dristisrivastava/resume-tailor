const mongoose=require('mongoose');
const User = require('./User');

const ResumeAnalysisSchema=new mongoose.Schema({
    userEmail:{
        type:String,
        required:false, 
    },
    orignalResume:{
        fileName: String,
        filePath:{
            type:String,
            required:true,
        },
        text:{
            type:String,
            required:true,
        },
        uploadedAt:{
            type:Date,
            default:Date.now,
        },
    },
    jobDescription:{
        fileName:String,
        filePath:{
            type:String,
            required:false,
        },
        text:{
            type:String,
            required:true,
        },
        uploadedAt:{
            type:Date,
            default:Date.now,
        },
    },
    //analyses result
    analysis:{
        matchScore:{
            type:Number,
            default:0,
            min:0,
            max:100,
        },
        //leywords
        resumeKeyword:[{
            word:String,
            frequency:Number,
            importance:Number,
        }],
        missingKeywords:[{
            word:String,
            frequency:Number,
            importance:{
                type:Number,
                default:1,
            }
        }],
        recommendation:{
        additions: [String],
        Removals:[String],
        feedback:String
        },
        analysedAt:{
            type:Date,
            default:Date.now,
        },
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
    updatedAt:{
        type:Date,
        default:Date.now,
    },
});
ResumeAnalysisSchema.pre('save',function(next){
    this.updatedAt=Date.now();
    next();
});
module.exports = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema, 'resume-tailor');
