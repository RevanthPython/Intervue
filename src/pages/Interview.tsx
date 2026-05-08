import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MeetingRoom from '../components/MeetingRoom';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Video, Shield, AlertCircle, Clock, User, Star, Briefcase, Globe } from 'lucide-react';

const Interview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  const [interview, setInterview] = useState<any>(null);
  const [otherParty, setOtherParty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const unsubscribe = onSnapshot(doc(db, 'interviews', id), async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setInterview(data);

        // Fetch other party details
        const otherId = profile?.role === 'candidate' ? data.interviewerId : data.candidateId;
        if (otherId) {
          const otherSnap = await getDoc(doc(db, 'users', otherId));
          if (otherSnap.exists()) {
            setOtherParty(otherSnap.data());
          }
        }
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `interviews/${id}`);
    });

    return unsubscribe;
  }, [id, user]);

  const checkJoinEligibility = () => {
    if (!interview) return false;

    const now = new Date();
    const startTime = interview.startTime.toDate();
    const endTime = interview.endTime.toDate();

    if (now < startTime) {
      setTimeError(`The interview is scheduled for ${startTime.toLocaleString()}. Please join at the scheduled time.`);
      return false;
    }

    if (now > endTime) {
      setTimeError("This interview session has already ended.");
      return false;
    }

    if (profile?.role === 'candidate' && !interview.interviewerJoined) {
      setTimeError("Please wait for the interviewer to join the session first.");
      return false;
    }

    return true;
  };

  const handleJoin = async () => {
    if (!checkJoinEligibility()) return;

    if (profile?.role === 'interviewer') {
      try {
        await updateDoc(doc(db, 'interviews', id!), {
          interviewerJoined: true
        });
      } catch (err) {
        console.error("Failed to update interviewer status", err);
      }
    }

    setHasJoined(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Interview...</div>;
  if (!interview) return <div className="min-h-screen flex items-center justify-center">Interview not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {!hasJoined ? (
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-xl border border-gray-100"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="text-center lg:text-left">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto lg:mx-0 mb-8">
                  <Video className="text-indigo-600 w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Ready to join your interview?</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Scheduled for: <span className="font-bold text-indigo-600">{interview.startTime.toDate().toLocaleString()}</span>
                  <br />
                  Duration: <span className="font-bold text-gray-900">60 Minutes</span>
                </p>
                
                {timeError && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start text-red-600 text-left">
                    <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium">{timeError}</p>
                  </div>
                )}

                <div className="bg-emerald-50 p-6 rounded-2xl flex items-start text-left mb-10">
                  <Shield className="w-5 h-5 text-emerald-600 mr-3 mt-0.5" />
                  <div>
                    <div className="text-emerald-800 font-bold text-sm">Secure Session</div>
                    <div className="text-emerald-600 text-xs">The interviewer must join first. You can only join during your 60-minute slot.</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleJoin}
                    className="flex-grow py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Join Meeting
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {otherParty && (
                <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <User className="w-5 h-5 mr-2 text-indigo-600" />
                    {profile?.role === 'candidate' ? 'Your Interviewer' : 'Candidate Details'}
                  </h3>
                  <div className="flex items-center space-x-4 mb-8">
                    <img src={otherParty.photoURL} alt="" className="w-16 h-16 rounded-2xl border-2 border-white shadow-sm" />
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{otherParty.displayName}</div>
                      <div className="text-sm text-gray-500 font-medium">
                        {profile?.role === 'candidate' 
                          ? `${otherParty.jobTitle || 'Senior Expert'} @ ${otherParty.company || 'Top Tech'}`
                          : otherParty.experience || 'Entry Level Candidate'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      {profile?.role === 'candidate' ? (
                        <>
                          <Star className="w-4 h-4 mr-3 text-yellow-400 fill-yellow-400" />
                          {otherParty.yearsOfExperience}+ Years Experience
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-4 h-4 mr-3 text-emerald-400" />
                          Skills: {otherParty.skills?.slice(0, 3).join(', ') || 'General Engineering'}
                        </>
                      )}
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-600">
                      <Globe className="w-4 h-4 mr-3 text-indigo-400" />
                      {otherParty.languages?.join(', ') || 'English'}
                    </div>
                    {profile?.role === 'candidate' && (
                      <div className="flex items-center text-sm font-medium text-gray-600">
                        <Briefcase className="w-4 h-4 mr-3 text-emerald-400" />
                        {otherParty.domains?.join(', ') || 'Engineering'}
                      </div>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-400 italic leading-relaxed">
                      {profile?.role === 'candidate' 
                        ? '"Looking forward to exploring your technical skills and discussing your professional journey."'
                        : `Bio: ${otherParty.bio?.substring(0, 100) || 'Competitive candidate with a strong technical background.'}...`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Video className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Live Interview Session</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Room ID: {id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-red-500 text-sm font-bold bg-red-50 px-4 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4 mr-2" />
                Recording Active
              </div>
              {profile?.role === 'interviewer' && (
                <button
                  onClick={async () => {
                    try {
                      await updateDoc(doc(db, 'interviews', id!), {
                        status: 'completed'
                      });
                      navigate(`/review/${id}`);
                    } catch (err) {
                      console.error("Failed to complete interview", err);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                >
                  Complete Interview
                </button>
              )}
            </div>
          </div>
          
          <div className="aspect-video w-full max-h-[700px]">
            <MeetingRoom 
              roomName={id || 'default-room'} 
              displayName={profile.displayName} 
              onLeave={() => navigate('/dashboard')} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Interview;
