import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SubmitComplaint.css';

function SubmitComplaint() {
  const [complaint, setComplaint] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [location, setLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [predictedCategory, setPredictedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:5000';

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    setUserEmail(email);
  }, []);

  // Auto-predict category as user types
  useEffect(() => {
    const predictCategory = async () => {
      if (complaint.length >= 10) {
        try {
          const response = await axios.post(`${API_URL}/predict_category`, { complaint });
          setPredictedCategory(response.data.category);
        } catch (error) {
          console.error('Error predicting category:', error);
        }
      } else {
        setPredictedCategory('');
      }
    };

    const debounceTimer = setTimeout(predictCategory, 500);
    return () => clearTimeout(debounceTimer);
  }, [complaint]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'File size exceeds 5MB limit.', type: 'error' });
        return;
      }
      
      // Check file type
      if (!file.type.match('image.*')) {
        setMessage({ text: 'Please upload an image file.', type: 'error' });
        return;
      }
      
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude}, ${longitude}`);
          setIsGettingLocation(false);
          setMessage({ text: 'Location detected successfully!', type: 'success' });
        },
        (error) => {
          console.error('Error getting location:', error);
          setMessage({ text: 'Failed to get location. Please enter manually or try again.', type: 'error' });
          setIsGettingLocation(false);
          
          // Fallback to IP-based geolocation
          fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
              if (data.latitude && data.longitude) {
                setLocation(`${data.latitude}, ${data.longitude}`);
                setMessage({ text: 'Location detected using IP address.', type: 'success' });
              }
            })
            .catch(err => {
              console.error('IP geolocation failed:', err);
            });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setMessage({ text: 'Geolocation is not supported by this browser.', type: 'error' });
      setIsGettingLocation(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      // Fallback: Show a message and stop recording
      setMessage({ text: 'Speech recognition is not supported in your browser. Please type your complaint.', type: 'error' });
      setIsRecording(false);
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const currentText = complaint ? complaint + ' ' : '';
      setComplaint(currentText + transcript);
      setIsRecording(false);
      setMessage({ text: 'Voice input captured successfully!', type: 'success' });
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setMessage({ text: `Speech recognition error: ${event.error}. Please type your complaint.`, type: 'error' });
      setIsRecording(false);
    };
    
    recognition.onend = () => {
      if (isRecording) {
        setIsRecording(false);
      }
    };
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setMessage({ text: 'Failed to start voice recording. Please type your complaint.', type: 'error' });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!complaint.trim()) {
      setMessage({ text: 'Please enter a complaint description.', type: 'error' });
      return;
    }
    
    if (complaint.trim().length < 10) {
      setMessage({ text: 'Complaint must be at least 10 characters long.', type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ text: 'Submitting complaint...', type: 'info' });
    
    try {
      const formData = new FormData();
      formData.append('complaint', complaint);
      formData.append('category', predictedCategory || 'Other');
      formData.append('anonymous', anonymous);
      
      if (location) {
        formData.append('location', location);
      } else {
        // Add default location if not provided
        formData.append('location', 'Not specified');
      }
      
      if (photo) {
        formData.append('photo', photo);
      }
      
      // Add timestamp and user info
      const submitter = anonymous ? 'Anonymous' : (userEmail || 'Anonymous');
      formData.append('submitted_by', submitter);
      formData.append('timestamp', new Date().toISOString());
      
      // Make sure we're using the correct endpoint name
      const response = await axios.post(`${API_URL}/submit_complaint`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 second timeout to allow for larger uploads
      });
      
      console.log('Submission response:', response.data);
      
      if (response.data && response.data.success) {
        setMessage({ text: 'Complaint submitted successfully!', type: 'success' });
        
        // Reset form
        setComplaint('');
        setPhoto(null);
        setPhotoPreview('');
        setLocation('');
        setPredictedCategory('');
        setAnonymous(false);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/mainpage');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
      
    } catch (error) {
      console.error('Error submitting complaint:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setMessage({ text: `Server error: ${error.response.data.message || error.response.statusText}`, type: 'error' });
      } else if (error.request) {
        // The request was made but no response was received
        setMessage({ text: 'No response from server. Please check your connection and try again.', type: 'error' });
      } else {
        // Something happened in setting up the request that triggered an Error
        setMessage({ text: 'Failed to submit complaint. Please try again later.', type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="submit-page">
      <h2>Submit a New Complaint</h2>
      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}
      
      <div className="tabs">
        <button 
          className={!showPreview ? "active" : ""} 
          onClick={() => setShowPreview(false)}
        >
          Submit
        </button>
        <button 
          className={showPreview ? "active" : ""} 
          onClick={togglePreview}
          disabled={complaint.length < 10}
        >
          Preview
        </button>
      </div>

      {showPreview ? (
        <div className="preview-container">
          <h3>Complaint Preview</h3>
          <div className="preview-card">
            <div className="preview-header">
              <span className="preview-category">{predictedCategory || 'Uncategorized'}</span>
              <span className="preview-status">New</span>
            </div>
            <p className="preview-text">{complaint}</p>
            {photoPreview && (
              <div className="preview-image">
                <img src={photoPreview} alt="Complaint evidence" />
              </div>
            )}
            {location && (
              <div className="preview-location">
                <strong>Location:</strong> {location}
              </div>
            )}
            <div className="preview-submitter">
              <strong>Submitted by:</strong> {anonymous ? 'Anonymous' : (userEmail || 'Anonymous')}
            </div>
          </div>
          <button onClick={() => setShowPreview(false)}>Edit Complaint</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Complaint Description</label>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Describe your complaint here (minimum 10 characters)..."
              rows="6"
              required
            />
            <div className="voice-input">
              {isRecording ? (
                <button type="button" onClick={stopRecording} className="recording">
                  Stop Recording
                </button>
              ) : (
                <button type="button" onClick={startRecording}>
                  <span className="mic-icon">🎤</span> Voice Input
                </button>
              )}
              <span className="voice-input-note">
                {window.SpeechRecognition || window.webkitSpeechRecognition 
                  ? "Click to speak your complaint" 
                  : "Voice input not supported in your browser"}
              </span>
            </div>
            {predictedCategory && (
              <div className="category-suggestion">
                Suggested category: <strong>{predictedCategory}</strong>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              Submit Anonymously
            </label>
          </div>

          <div className="input-group">
            <label>Upload Photo Evidence (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoChange}
              className="file-input"
            />
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button type="button" onClick={() => {setPhoto(null); setPhotoPreview('');}}>
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="input-group">
            <label>Location (Optional)</label>
            <div className="location-input">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location or use GPS"
              />
              <button 
                type="button" 
                onClick={getLocation} 
                disabled={isGettingLocation}
                className="location-btn"
              >
                {isGettingLocation ? 'Getting Location...' : '📍 Get Location'}
              </button>
            </div>
          </div>

          <div className="button-group">
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
            <button type="button" onClick={() => navigate('/mainpage')} className="back-btn">
              Back to Home
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SubmitComplaint;