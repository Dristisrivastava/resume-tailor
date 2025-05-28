import React, { useState } from 'react';
import './App.css';

function App() {
  const [resume, setresume] = useState(null);
  const [jobDescription, setjobDescription] = useState(null);
  const [isLoading, setisLoading] = useState(null);
  const [message, setmessage] = useState(null);
  const [error, seterror] = useState(null);
  const [analysisresult, setanalysisresult] = useState(null);

  const handelresume = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setresume(file);
      seterror('');
    } else {
      setresume(null);
      seterror('give only pdf file');
    }
  };

  const handeljobdesc = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      setjobDescription(file);
      seterror('');
    } else {
      setjobDescription(null);
      seterror('give pdf or txt file');
    }
  };

  const handelsubmit = async (e) => {
    e.preventDefault();
    if (!resume || !jobDescription) {
      seterror('please upload both the files');
      return;
    }
    try {
      setisLoading(true);
      setanalysisresult(null);
      const formData = new FormData();
      formData.append('resume', resume);
      formData.append('jobDescription', jobDescription);
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setmessage('file uploaded, please wait a while');
        seterror('');
        setanalysisresult(data.results);
      } else {
        seterror(data.message || 'some error has occured please try again');
        setmessage('');
        setanalysisresult(null);
      }
    } catch (error) {
      seterror('server error');
      setanalysisresult(null);
      console.error('err uploading', error);
    } finally {
      setisLoading(false);
    }
  };

  const resetForm = () => {
    setresume(null);
    setjobDescription(null);
    setanalysisresult(null);
    setmessage('');
    seterror('');
    document.getElementById('resume').value = '';
    document.getElementById('jobDescription').value = '';
  };

  const getScorecolor = (score) => {
    if (score >= 70) return '#27ae60'; // Green
    if (score >= 50) return '#f39c12'; // Orange
    if (score >= 30) return '#e67e22'; // Dark orange
    return '#e74c3c'; // Red
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Resume Update</h1>
        <p>Upload your resume and a job description to get updated resume</p>
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
            <label htmlFor="jobDescription">Upload Job Description (PDF or TXT):</label>
            <input
              type="file"
              id="jobDescription"
              accept=".pdf,.txt"
              onChange={handeljobdesc}
              className="file-input"
            />
            {jobDescription && <p className="file-selected">Selected: {jobDescription.name}</p>}
          </div>

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button
            type="submit"
            className="submit-button"
            disabled={isLoading || !resume || !jobDescription}
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
              <strong>Similarity Score:</strong> {analysisresult.simarityscore}%
            </p>
            <p>
              <strong>Feedback:</strong> {analysisresult.feedback}
            </p>
            <div>
              <h3>Top Resume Keywords</h3>
              <ul>
                {analysisresult.topresumekey.map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Top Job Description Keywords</h3>
              <ul>
                {analysisresult.topjobkey.map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Recommended Additions</h3>
              <ul>
                {analysisresult.Addition.map((word, index) => (
                  <li key={index}>{word}</li>
                ))}
              </ul>
            </div>
            {analysisresult.removal && analysisresult.removal.length > 0 && (
              <div>
                <h3>Suggested Removals</h3>
                <ul>
                  {analysisresult.removal.map((word, index) => (
                    <li key={index}>{word}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
