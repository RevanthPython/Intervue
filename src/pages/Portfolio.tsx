import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Star, MapPin, Briefcase, Video, Shield, Award, MessageSquare, Download, Play, ExternalLink, Zap, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Portfolio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [candidate, setCandidate] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInterview, setActiveInterview] = useState<any>(null);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      if (!user) setLoading(false);
      return;
    }

    const fetchCandidate = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'users', id));
        if (docSnap.exists()) {
          setCandidate(docSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${id}`);
      }
    };

    const q = query(
      collection(db, 'interviews'),
      where('candidateId', '==', id),
      where('status', '==', 'reviewed')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInterviews(data);
      if (data.length > 0) setActiveInterview(data[0]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'interviews');
    });

    fetchCandidate();
    return unsubscribe;
  }, [id, user]);

  const handleContact = async () => {
    setContacting(true);
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(db, 'interestRequests'), {
        candidateId: id,
        candidateName: candidate.displayName,
        candidateEmail: candidate.email,
        companyId: user?.uid,
        companyName: profile?.companyName || profile?.displayName || user?.displayName || 'A Company',
        companyEmail: user?.email || '',
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert(`Interest request sent to ${candidate.displayName}! They will be notified.`);
    } catch (error) {
      console.error('Error contacting candidate:', error);
      alert('Failed to send request.');
    } finally {
      setContacting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <User className="text-indigo-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign in to view portfolios</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          To protect candidate privacy and verified interview data, you must be signed in to view detailed portfolios.
        </p>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
        >
          Sign In from Navbar
        </button>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Portfolio...</div>;
  if (!candidate) return <div className="min-h-screen flex items-center justify-center">Candidate not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Profile */}
      <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-sm border border-gray-100 mb-12">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            src={candidate.photoURL || `https://i.pravatar.cc/300?u=${id}`} 
            alt={candidate.displayName}
            className="w-48 h-48 rounded-[2.5rem] object-cover border-4 border-indigo-50 shadow-xl"
          />
          <div className="flex-grow text-center lg:text-left">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{candidate.displayName}</h1>
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 text-gray-500 font-medium">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {candidate.location || 'Remote'}</span>
                  <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1" /> {candidate.experience || 'Senior Developer'}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    <Shield className="w-3 h-3 mr-1" /> Verified
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center lg:justify-end space-x-3">
                <button 
                  onClick={handleContact}
                  disabled={contacting}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {contacting ? 'Sending...' : 'Contact Candidate'}
                </button>
                <button className="p-3 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-all">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed max-w-3xl">
              {candidate.bio || "Passionate software engineer with expertise in building scalable web applications. Focused on clean code and exceptional user experiences."}
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-8">
              {(candidate.skills || ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker']).map((skill: string) => (
                <span key={skill} className="px-4 py-2 bg-gray-50 rounded-xl text-sm font-bold text-gray-700 border border-gray-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Video & Feedback */}
        <div className="lg:col-span-2 space-y-12">
          {activeInterview ? (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Featured Interview</h2>
                <div className="flex items-center space-x-2 text-sm font-bold text-indigo-600">
                  <Award className="w-4 h-4" />
                  <span>Verified Session</span>
                </div>
              </div>
              
              <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl aspect-video relative group">
                <img 
                  src="https://picsum.photos/seed/interview-video/1280/720" 
                  alt="Interview Thumbnail" 
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-indigo-600 fill-indigo-600 ml-1" />
                  </button>
                </div>
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                    <div className="text-white font-bold">Technical Round: System Architecture</div>
                    <div className="text-white/60 text-xs">Conducted by Senior Architect @ Google</div>
                  </div>
                </div>
              </div>

              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                    <Star className="w-5 h-5 mr-2 text-yellow-400 fill-yellow-400" />
                    Expert Ratings
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Technical Proficiency', score: 9.5 },
                      { label: 'Communication', score: 9.0 },
                      { label: 'Problem Solving', score: 8.5 },
                      { label: 'Confidence', score: 9.2 }
                    ].map((rating) => (
                      <div key={rating.label}>
                        <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
                          <span>{rating.label}</span>
                          <span>{rating.score}/10</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${rating.score * 10}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-indigo-600 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                  <h3 className="text-lg font-bold mb-6 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-yellow-300 fill-yellow-300" />
                    AI Insights
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Feedback Tone</div>
                      <div className="text-xl font-bold">Encouraging & Professional</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-2">Key Strengths</div>
                      <div className="flex flex-wrap gap-2">
                        {['Articulate', 'Deep Tech Knowledge', 'Structured Thinking'].map(s => (
                          <span key={s} className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                      <div className="text-4xl font-black">9.4</div>
                      <div className="text-xs font-bold text-indigo-200 uppercase tracking-widest mt-1">Overall AI Score</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Interview Summary</h3>
                <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed">
                  <ReactMarkdown>
                    {activeInterview.aiSummary || "The candidate demonstrated exceptional understanding of React hooks and state management. They were able to explain complex architectural decisions clearly and provided optimized solutions for the coding challenges. Their communication style is collaborative and professional."}
                  </ReactMarkdown>
                </div>
              </div>
            </section>
          ) : (
            <div className="bg-white p-24 rounded-[3rem] border border-gray-100 text-center">
              <Video className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900">No verified interviews yet</h3>
              <p className="text-gray-500">This candidate hasn't completed any verified interviews yet.</p>
            </div>
          )}
        </div>

        {/* Sidebar - Other Interviews */}
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Other Interviews</h3>
            <div className="space-y-4">
              {interviews.length > 1 ? interviews.map((interview) => (
                <button 
                  key={interview.id}
                  onClick={() => setActiveInterview(interview)}
                  className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center space-x-4 ${
                    activeInterview?.id === interview.id 
                    ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                    : 'bg-white border-gray-100 hover:border-indigo-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeInterview?.id === interview.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">Frontend Engineering</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      {new Date(interview.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </button>
              )) : (
                <div className="p-8 bg-gray-50 rounded-[2rem] text-center border border-gray-100">
                  <p className="text-sm text-gray-400 font-medium">No other sessions available</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-100">
            <h3 className="font-bold text-lg mb-4">Recruiter Note</h3>
            <p className="text-emerald-50 text-sm leading-relaxed mb-6">
              This candidate has been pre-screened by our experts. You can skip the initial technical round and move directly to the final interview.
            </p>
            <div className="flex items-center text-xs font-bold uppercase tracking-widest text-emerald-200">
              <Shield className="w-4 h-4 mr-2" />
              Verified Candidate
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
