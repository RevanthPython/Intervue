import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Briefcase, CheckCircle, AlertCircle, ArrowRight, Star, Shield } from 'lucide-react';

const ScheduleInterview: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup Questions State
  const [setupData, setSetupData] = useState({
    currentStatus: '',
    yearsOfExperience: 0,
    skills: '',
    domains: '',
    languages: '',
    bio: ''
  });

  // Scheduling State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const skillsArray = setupData.skills.split(',').map(s => s.trim());
      const domainsArray = setupData.domains.split(',').map(s => s.trim());
      const languagesArray = setupData.languages.split(',').map(s => s.trim());

      await updateDoc(doc(db, 'users', user.uid), {
        yearsOfExperience: Number(setupData.yearsOfExperience),
        skills: skillsArray,
        domains: domainsArray,
        languages: languagesArray,
        bio: setupData.bio,
        experience: `${setupData.yearsOfExperience} years`
      });
      setStep(2);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!user || !profile || !selectedDate || !selectedTime) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Find an interviewer with more experience
      const interviewersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'interviewer'),
        where('yearsOfExperience', '>', Number(profile.yearsOfExperience || setupData.yearsOfExperience))
      );
      
      const interviewerSnap = await getDocs(interviewersQuery);
      const availableInterviewers = interviewerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (availableInterviewers.length === 0) {
        setError("No interviewers with higher experience are currently available for your profile. Please try again later.");
        setLoading(false);
        return;
      }

      // Assign a random interviewer from the filtered list
      const assignedInterviewer: any = availableInterviewers[Math.floor(Math.random() * availableInterviewers.length)];

      // 2. Create the interview document
      const startTime = new Date(`${selectedDate}T${selectedTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 60 minutes later

      const interviewData = {
        candidateId: user.uid,
        interviewerId: assignedInterviewer.id,
        status: 'scheduled',
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        interviewerJoined: false,
        candidateSetup: {
          currentStatus: setupData.currentStatus,
          experienceSummary: setupData.bio,
          targetFields: setupData.domains.split(',').map(s => s.trim())
        },
        createdAt: Timestamp.now()
      };

      await addDoc(collection(db, 'interviews'), interviewData);
      navigate('/dashboard');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'interviews');
      setError("Failed to schedule interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Schedule Your Interview</h1>
        <p className="text-lg text-gray-600">Complete your profile and pick a time for your 60-minute session.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-12 space-x-4">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>1</div>
          <span className="font-bold text-sm">Setup</span>
        </div>
        <div className="w-12 h-0.5 bg-gray-200" />
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>2</div>
          <span className="font-bold text-sm">Schedule</span>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start text-red-600">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {step === 1 ? (
        <motion.form 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSetupSubmit}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Current Status</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Student, Software Engineer at X"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={setupData.currentStatus}
                onChange={e => setSetupData({...setupData, currentStatus: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Years of Experience</label>
              <input 
                required
                type="number" 
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={setupData.yearsOfExperience}
                onChange={e => setSetupData({...setupData, yearsOfExperience: Number(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Skills (comma separated)</label>
            <input 
              required
              type="text" 
              placeholder="React, Node.js, Python..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={setupData.skills}
              onChange={e => setSetupData({...setupData, skills: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Domains (comma separated)</label>
              <input 
                required
                type="text" 
                placeholder="Fintech, E-commerce, AI..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={setupData.domains}
                onChange={e => setSetupData({...setupData, domains: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Languages (comma separated)</label>
              <input 
                required
                type="text" 
                placeholder="English, Spanish, Hindi..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={setupData.languages}
                onChange={e => setSetupData({...setupData, languages: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Professional Bio</label>
            <textarea 
              required
              rows={4}
              placeholder="Tell us about your professional background..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              value={setupData.bio}
              onChange={e => setSetupData({...setupData, bio: e.target.value})}
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to Scheduling"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </motion.form>
      ) : (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                Select Date & Time
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Time (60 min slot)</label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={selectedTime}
                    onChange={e => setSelectedTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
              <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Interviewer Matching
              </h3>
              <ul className="space-y-4 text-sm text-indigo-700 font-medium">
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Matched with an expert having {profile.yearsOfExperience || setupData.yearsOfExperience}+ years of experience.
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  Interviewer will be assigned automatically based on your skills.
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  60-minute focused technical session.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setStep(1)}
              className="flex-grow py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all"
            >
              Back
            </button>
            <button 
              disabled={loading || !selectedDate || !selectedTime}
              onClick={handleSchedule}
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Confirm & Schedule"}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScheduleInterview;
