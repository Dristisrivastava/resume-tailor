import React, { useState } from 'react';
import './App.css';

function App() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [resume, setresume] = useState(null);
  const [jobDescription, setjobDescription] = useState('');
  const [isLoading, setisLoading] = useState(false);
  const [message, setmessage] = useState('');
  const [error, seterror] = useState('');
  const [analysisresult, setanalysisresult] = useState(null);

  const handelresume = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setresume(file);
      seterror('');
    } else {
      setresume(null);
      seterror('Please upload a PDF file for resume.');
    }
  };

  const handleJobDescChange = (e) => {
    setjobDescription(e.target.value);
  };

  const handelsubmit = async (e) => {
    e.preventDefault();
    if (!resume || !jobDescription.trim()) {
      seterror('Please upload your resume and type the job description.');
      return;
    }
    try {
      setisLoading(true);
      setanalysisresult(null);
      setmessage('');
      seterror('');
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('jobDescriptionText', jobDescription); // Text instead of file

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setmessage('File uploaded successfully! Here is the analysis:');
        seterror('');
        setanalysisresult({
          ...data.result,
          topresumekey: data.result.topresumekey || [],
          topjobkey: data.result.topjobkey || [],
          additions: data.result.additions || [],
          removal: data.result.removal || [],
          matchScore: data.result.matchScore || 0,
          similarityscore: data.result.similarityscore || 0,
          feedback: data.result.feedback || ''
        });
      } else {
        seterror(data.message || 'Some error occurred. Please try again.');
        setmessage('');
        setanalysisresult(null);
      }
    } catch (error) {
      seterror('Server error. Please try again later.');
      setanalysisresult(null);
      console.error('Error uploading files:', error);
    } finally {
      setisLoading(false);
    }
  };

  const resetForm = () => {
    setresume(null);
    setjobDescription('');
    setanalysisresult(null);
    setmessage('');
    seterror('');
    document.getElementById('resume').value = '';
  };

  const getScorecolor = (score) => {
    if (score >= 70) return '#27ae60';
    if (score >= 50) return '#f39c12';
    if (score >= 30) return '#e67e22';
    return '#e74c3c';
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resume Update</h1>
        <p>Upload your resume and paste the job description to get updated resume analysis</p>
      </header>

      <main className="App-main">
        <form onSubmit={handelsubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="resume">Upload Your Resume (PDF only):</label>
            <input
              type="file"
              id="resume"
              accept=".pdf"
              onChange={handelresume}
              className="file-input"
            />
            {resume && <p className="file-selected">Selected: {resume.name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="jobDescription">Paste Job Description:</label>
            <textarea
              id="jobDescription"
              rows="6"
              value={jobDescription}
              onChange={handleJobDescChange}
              placeholder="Paste or type the job description here..."
              className="text-input"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || !resume || !jobDescription.trim()}
          >
            {isLoading ? 'Uploading...' : 'Analyze Resume'}
          </button>

          <button
            type="button"
            className="reset-button"
            onClick={resetForm}
            disabled={isLoading}
            style={{ marginLeft: '10px' }}
          >
            Reset
          </button>
        </form>

        {analysisresult && (
          <div className="result-container">
            <h2>Analysis Result</h2>
            <p>
              <strong>Match Score:</strong>{' '}
              <span style={{ color: getScorecolor(analysisresult.matchScore) }}>
                {analysisresult.matchScore}%
              </span>
            </p>
            <p>
              <strong>Similarity Score:</strong> {analysisresult.similarityscore}%
            </p>
            <p>
              <strong>Feedback:</strong> {analysisresult.feedback}
            </p>

            <div>
              <h3>Top Resume Keywords</h3>
              <ul>
                {(analysisresult.topresumekey || []).map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Top Job Description Keywords</h3>
              <ul>
                {(analysisresult.topjobkey || []).map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3>Recommended Additions</h3>
              <ul>
                {(analysisresult.additions || []).map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
