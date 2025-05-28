const natural=require('natural');
//this file hepl in analysing and comparing text

const stopWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'among', 'within', 'without', 'against', 'toward', 'upon', 'concerning', 'is',
  'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall'
]);

/**
 * function to remove extra space and puntuation
 * @param {string} text -raw text to clean
 * @returns {string} -clean text
 */
function cleanText(text){
    return text
    .toLowerCase()
    .replace(/[^\w\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

/**
 * this function create a sorted map for word and its number of occurance
 * @param {string} text 
 * @param {number} minlen  -default 3
 * @returns {Array} -array of word:freq 
 */

function keywordExtract(text , minlen=3){
    const cleanedtext =cleanText(text);
    const word =cleanedtext.split(/\s+/);  // create a array with all words 
    const wordfreq = {};

    word.forEach(worf =>{
        if(word.length >=minlen && !stopWords){ //store word count
            wordfreq[word] =(wordfreq[word] || 0) +1;  //if word is appearing for first time then 0+1
        }
    });

    return Object.entries(wordfreq)
    .map(([word ,frequency])=>({word,frequency}))
    .sort((a,b) => b.frequency - a.frequency);
}

/**
 * this function calculate TF-IDF score
 * @param {string} document -text of doc like resume
 * @param {Array} docarray  -array of all document
 * @returns {Array}
 */

function TFIDFCalculation(document,docarray){  //IDF means inverse document frequency
    const TFIdf =natural.TfIdf;
    const tfidf=new TFIdf();

    docarray.forEach(doc => tfidf.addDocument(doc)) ;//add every doc in docarray in tfidf
    const docindex=docarray.indexOf(document);
    const score=[];

    tfidf.listTerms(docindex).forEach(item => { //gets all word in document of docindex 
        if(item.term.length >=3 && !stopWords.has(item.term)){
            score.push({
                word: item.term,
                tfidf: item.tfidf
            });
        }
    });    
    return score.sort((a,b) => b.tfidf -a.tfidf);  //sort as per tfidf score
}

/**
 * this function find out number of matching and missing words
 * @param {Array} resumekey -array having {word : frequency}
 * @param {Array} jobkey  -array having {word : freq} for job
 * @returns {object}  -marching result
 */

function matchingKeywords(resumekey,jobkey){
    const resumewords = new Set(resumekey.map(k => k.word));
    const jobword = new Set(jobkey.map(k => k.word));

    const match = jobkey.filter(jobkey => 
        resumewords.has(jobkey.word) //it is storing matching words that is in job and resume
    );

    const miss = jobkey.filter(jobkey =>
        !resumewords.has(jobkey.word) //store words not present in resume but present in jobdesc
    );
    const extra = resumekey.filter(resumekey =>
        !jobword.has(resumekey.word) //store words that are extra in resume
    );
    return{  // returns all the detain that can be taken out
        match,
        miss: miss.slice(0,20),
        extra: extra.slice(0,10),
        matchcount: match.length,
        totaljobkey: jobkey.length,
        matchpercentage: jobkey.length > 0 ?
        (match.length / jobkey.length * 100).toFixed(2) : 0
    };
}

/**
 * count simarity count by dividing number of intersection and union
 * @param {string} textone
 * @param {string} texttwo
 * @returns {number}  -similarity score
 */

function similarityCalc(textone,texttwo){
    const keyone=new Set(keywordExtract(textone).map(k => k.word));
    const keytwo =new Set(keywordExtract(texttwo).map(k => k.word));

    const intersect = new Set([...keyone].filter(x => keytwo.has(x)));
    const union =new Set([...keyone,...keytwo]);

    return union.size >0 ? intersect.size /union.size : 0;
}

/**
 * this function give final recomendation
 * @param {object} keyanalysis -result from keymatch
 * @returns {object} -reccomended changes
 */

function recommendationGenerate(keyanalysis){
    const { miss,extra,matchpercentage} = keyanalysis;

    const recomendation = {
        score:parseFloat(matchpercentage),
        Additions:[],
        removal:[],
        feedback:''
    };
    recomendation.Additions = miss.slice(0,10).map(keyword => keyword.word);

    if(matchpercentage< 30){
        recomendation.removal=extra.slice(-5).map(keyword => keyword.word);
    }
    if(matchpercentage >=70){
        recomendation.feedback = 'Excellent match! your resume is perfect for the job';
    }else if(matchpercentage >=50){
        recomendation.feedback = 'Good match! add some more relevant keywords to improve.';
    }else if(matchpercentage >=30){
        recomendation.feedback='Moderate match. but you can make some changes to improve and try again.';
    }else{
        recomendation.feedback='Low match. consider significantly tailoring your resume to be a better match and try again.';
    }

    return recomendation;
}

module.exports = {
    cleanText,
    keywordExtract,
    TFIDFCalculation,
    matchingKeywords,
    similarityCalc,
    recommendationGenerate
};