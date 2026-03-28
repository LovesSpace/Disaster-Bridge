import React, { useState, useRef } from 'react';

const SCENARIOS = [
  { label: 'Flood', text: 'Severe flooding in residential area, 3 families stranded on rooftops, roads submerged, power lines down, one person with diabetes needs insulin.' },
  { label: 'Earthquake', text: '6.2 magnitude earthquake, several buildings collapsed downtown, gas leaks reported, trapped survivors calling for help, hospitals overwhelmed.' },
  { label: 'Building Fire', text: 'High-rise fire on 8th floor, smoke spreading to upper floors, 20+ people unable to evacuate, one pregnant woman, elevator non-functional.' }
];

const InputPanel = ({ onAnalyze, loading }) => {
  const [type, setType] = useState('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [location, setLocation] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setText('');
    setFile(null);
    setLocation(null);
  };

  const handleScenarioClick = (scenarioText) => {
    setText(scenarioText);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice-recording.webm', { type: 'audio/webm' });
        setFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    }, () => {
      alert("Unable to retrieve your location");
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!type) return;

    const formData = new FormData();
    formData.append('type', type);
    
    if (type === 'text') formData.append('text', text);
    if (type === 'location') {
      formData.append('lat', location?.lat);
      formData.append('lng', location?.lng);
      formData.append('text', text); // Optional additional description
    }
    if (['image', 'voice', 'file'].includes(type) && file) {
      formData.append('file', file);
    }

    onAnalyze(formData);
  };

  return (
    <div className="panel">
      <div className="card">
        <div className="input-type-selector">
          <label>Emergency Category</label>
          <select className="type-select" value={type} onChange={handleTypeChange}>
            <option value="text">Text Description</option>
            <option value="voice">Voice Recording</option>
            <option value="image">Image Upload</option>
            <option value="location">GPS Location</option>
            <option value="file">File (PDF/TXT)</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          {type === 'text' && (
            <div className="input-group">
              <label className="label-small">Describe the situation</label>
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder="Details of the emergency..."
                required
              />
              <div className="pills">
                {SCENARIOS.map((s, i) => (
                  <button key={i} type="button" className="pill" onClick={() => handleScenarioClick(s.text)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'voice' && (
            <div className="input-group">
              <label className="label-small">Record Audio</label>
              <button 
                type="button" 
                className={`mic-button ${recording ? 'recording' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
              >
                <span style={{fontSize: '32px'}}>🎙️</span>
              </button>
              <p style={{textAlign: 'center', fontSize: '13px', color: 'var(--color-text-light)'}}>
                {recording ? 'Recording... release to stop' : file ? `Captured: ${file.name}` : 'Hold to record'}
              </p>
            </div>
          )}

          {type === 'image' && (
            <div className="input-group">
              <label className="label-small">Upload Image</label>
              <div className="dropzone" onClick={() => document.getElementById('image-input').click()}>
                {file ? file.name : 'Click to select an image'}
                <input 
                  id="image-input"
                  type="file" 
                  accept="image/*" 
                  style={{display: 'none'}} 
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {type === 'location' && (
            <div className="input-group">
              <label className="label-small">Detect Location</label>
              <button type="button" className="btn-primary" style={{backgroundColor: '#f3f4f6', color: '#111827', border: '1px solid #e5e5e5'}} onClick={detectLocation}>
                {location ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Get Current GPS'}
              </button>
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder="Additional notes about the location (optional)"
              />
            </div>
          )}

          {type === 'file' && (
            <div className="input-group">
              <label className="label-small">Upload PDF or TXT</label>
              <div className="dropzone" onClick={() => document.getElementById('file-input').click()}>
                {file ? file.name : 'Click to select a file'}
                <input 
                  id="file-input"
                  type="file" 
                  accept=".pdf,.txt" 
                  style={{display: 'none'}} 
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading || (type !== 'text' && type !== 'location' && !file) || (type === 'text' && !text)}>
            {loading ? 'Analyzing...' : 'Analyze Emergency'}
          </button>
        </form>

        <div className="privacy-notice">
          Your data is never stored or logged. Gemini API calls are transient.
        </div>
      </div>
    </div>
  );
};

export default InputPanel;
