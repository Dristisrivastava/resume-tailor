const natural = require('natural');

const stopWords = new Set([
  // Original common stop words...
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'among', 'within', 'without', 'against', 'toward',
  'upon', 'concerning', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
  'can', 'may', 'might', 'must', 'shall',
  'understanding', 'job','help','data','tools','build', 'description', 'link', 'com', 'www', 'http', 'https',
  'our', 'we', 'that', 'this', 'you', 'your', 'it', 'll', 're', 'us', 'also', 'as',
  'at','looking', 'work','across','feedback','what','learn','gain','ready','who','why',

  // New additions based on your case
  'city', 'new', 'most', 'rs', 'ctc', 'award', 'done', 'location', 'date',
  'joining', 'stipend', 'duration', 'professor', 'kiit', 'du', 'months', 'month',
  'range', 'based', 'performance', 'offered', 'internship', 'criteria', 'process',
  'notified', 'immediately', 'supportive','team','exposure','hyderabad','platform','imagining', 'india', 'job', 'intern', 'employee'
]);

const recommendedWords = new Set([
  // original
  'c++', 'java', 'python', 'javascript', 'html', 'css', 'react', 'nodejs', 'express',
  'sql', 'nosql', 'mongodb', 'postgresql', 'aws', 'azure', 'git', 'docker', 'kubernetes',
  'linux', 'bash', 'shell', 'machine learning', 'deep learning', 'ai', 'nlp',
  'data analysis', 'data visualization', 'tensorflow', 'pytorch','gcp','deployment','visualization','leaders','healthcare','technical',
  'communication', 'teamwork', 'problem solving', 'leadership', 'creativity','user','ai product','backend','development',
  'api','global','client','operating system' ,'operating' ,'databases','software','design','interfaces','c#','deep learning',
  'ai robotics','robotics' , 'python','machine learning','writer','web','developer','vedeo','editor','social','apis'
]);

function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDateLike(word) {
  const months = [
    'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'
  ];
  if (months.some(m => word.includes(m))) return true;
  if (/^\d{1,2}(st|nd|rd|th)$/.test(word)) return true;
  return false;
}

function keywordExtract(text, minlen = 2, ngramMax = 3) {
  const cleanedtext = cleanText(text);
  const wordsRaw = cleanedtext.split(/\s+/);

  const words = wordsRaw.filter(
    w => !stopWords.has(w) && w.length >= minlen && !/\d/.test(w) && !isDateLike(w)
  );

  const freq = {};

  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });

  for (let n = 2; n <= ngramMax; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(' ');
      const ngramTokens = ngram.split(' ');
      if (
        ngramTokens.some(
          w => stopWords.has(w) || /\d/.test(w) || w.length < minlen || isDateLike(w)
        )
      )
        continue;
      freq[ngram] = (freq[ngram] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .map(([word, frequency]) => ({ word, frequency }))
    .sort((a, b) => b.frequency - a.frequency);
}

function TFIDFCalculation(document, docarray) {
  const TFIdf = natural.TfIdf;
  const tfidf = new TFIdf();

  docarray.forEach(doc => tfidf.addDocument(doc));
  const docindex = docarray.indexOf(document);
  const score = [];

  tfidf.listTerms(docindex).forEach(item => {
    if (item.term.length >= 3 && !stopWords.has(item.term)) {
      score.push({ word: item.term, tfidf: item.tfidf });
    }
  });
  return score.sort((a, b) => b.tfidf - a.tfidf);
}

function matchingKeywords(resumekey, jobkey) {
  const resumewords = new Set(resumekey.map(k => k.word));
  const jobword = new Set(jobkey.map(k => k.word));

  const match = jobkey.filter(jk => resumewords.has(jk.word));
  const miss = jobkey.filter(jk => !resumewords.has(jk.word));
  const extra = resumekey.filter(rk => !jobword.has(rk.word));

  return {
    match,
    miss: miss.slice(0, 30),
    extra: extra.slice(0, 20),
    matchcount: match.length,
    totaljobkey: jobkey.length,
    matchpercentage:
      jobkey.length > 0 ? ((match.length / jobkey.length) * 100).toFixed(2) : 0
  };
}

function similarityCalc(textone, texttwo) {
  const keyone = new Set(keywordExtract(textone).map(k => k.word));
  const keytwo = new Set(keywordExtract(texttwo).map(k => k.word));

  const intersect = new Set([...keyone].filter(x => keytwo.has(x)));
  const union = new Set([...keyone, ...keytwo]);

  return union.size > 0 ? intersect.size / union.size : 0;
}

function recommendationGenerate(keyanalysis, resumekeywords = []) {
  const { miss, extra, matchpercentage } = keyanalysis;

  const resumeSet = new Set(resumekeywords.map(k => k.word.toLowerCase()));

  const recommendedMissing = [...recommendedWords].filter(r => !resumeSet.has(r));

  const filteredAdditions = miss
    .map(k => k.word.toLowerCase())
    .filter(word => recommendedWords.has(word));

  const recommendation = {
    score: parseFloat(matchpercentage),
    additions: filteredAdditions,
    removal: extra.map(k => k.word),
    recommendedMissing: recommendedMissing,
    feedback: ''
  };

  if (recommendation.score < 30) {
    recommendation.feedback =
      'Low match. Consider significantly tailoring your resume to be a better match and try again.';
  } else if (recommendation.score < 60) {
    recommendation.feedback =
      'Moderate match. Add more relevant keywords from the job description.';
  } else {
    recommendation.feedback =
      'Good match. Minor updates may improve your chances further.';
  }

  return recommendation;
}

module.exports = {
  cleanText,
  keywordExtract,
  TFIDFCalculation,
  matchingKeywords,
  similarityCalc,
  recommendationGenerate,
  recommendedWords
};
