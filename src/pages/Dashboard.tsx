import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Star, Clock, CheckCircle, Plus, Briefcase, User, Settings, LogOut, Shield, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, profile, setRole, switchProfileRole, resetProfile, logout } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', location: '', type: 'Full-time', salaryRange: '' });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>({});

  const handleEditProfileClick = () => {
    setEditProfileData({
      displayName: profile?.displayName || '',
      companyName: profile?.companyName || '',
      bio: profile?.bio || '',
      jobTitle: profile?.jobTitle || '',
      company: profile?.company || '',
      yearsOfExperience: profile?.yearsOfExperience || 0,
      skills: profile?.skills?.join(', ') || '',
      domains: profile?.domains?.join(', ') || '',
      languages: profile?.languages?.join(', ') || '',
      location: profile?.location || '',
      industry: profile?.industry || '',
      companySize: profile?.companySize || ''
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { updateDoc, doc, writeBatch, collection, query, where, getDocs } = await import('firebase/firestore');
      const updateData: any = {
        displayName: editProfileData.displayName
      };

      if (profile?.role === 'company') {
        updateData.companyName = editProfileData.companyName;
        updateData.industry = editProfileData.industry;
        updateData.companySize = editProfileData.companySize;

        const batch = writeBatch(db);
        
        const jobsQ = query(collection(db, 'jobs'), where('companyId', '==', user.uid));
        const jobsSnap = await getDocs(jobsQ);
        jobsSnap.forEach(docSnap => batch.update(docSnap.ref, { companyName: editProfileData.companyName }));

        const reqsQ = query(collection(db, 'interestRequests'), where('companyId', '==', user.uid));
        const reqsSnap = await getDocs(reqsQ);
        reqsSnap.forEach(docSnap => batch.update(docSnap.ref, { companyName: editProfileData.companyName }));

        const appsQ = query(collection(db, 'applications'), where('companyId', '==', user.uid));
        const appsSnap = await getDocs(appsQ);
        appsSnap.forEach(docSnap => batch.update(docSnap.ref, { companyName: editProfileData.companyName }));

        await batch.commit();
      } else if (profile?.role === 'candidate') {
        updateData.bio = editProfileData.bio;
        updateData.location = editProfileData.location;
        updateData.yearsOfExperience = Number(editProfileData.yearsOfExperience);
        updateData.skills = editProfileData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
        updateData.domains = editProfileData.domains.split(',').map((s: string) => s.trim()).filter(Boolean);
        updateData.languages = editProfileData.languages.split(',').map((s: string) => s.trim()).filter(Boolean);

        const batch = writeBatch(db);
        
        const appsQ = query(collection(db, 'applications'), where('candidateId', '==', user.uid));
        const appsSnap = await getDocs(appsQ);
        appsSnap.forEach(docSnap => batch.update(docSnap.ref, { candidateName: editProfileData.displayName }));

        const reqsQ = query(collection(db, 'interestRequests'), where('candidateId', '==', user.uid));
        const reqsSnap = await getDocs(reqsQ);
        reqsSnap.forEach(docSnap => batch.update(docSnap.ref, { candidateName: editProfileData.displayName }));

        await batch.commit();
      } else if (profile?.role === 'interviewer') {
        updateData.jobTitle = editProfileData.jobTitle;
        updateData.company = editProfileData.company;
        updateData.yearsOfExperience = Number(editProfileData.yearsOfExperience);
        updateData.domains = editProfileData.domains.split(',').map((s: string) => s.trim()).filter(Boolean);
        updateData.languages = editProfileData.languages.split(',').map((s: string) => s.trim()).filter(Boolean);
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Close modal. Real-time onSnapshot in AuthContext will handle the profile update.
      setShowEditProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleResetProfile = async () => {
    if (!user || !window.confirm('Are you sure you want to reset your profile? This will delete your account data and you will need to set up your profile again.')) return;
    
    setResetting(true);
    try {
      await resetProfile();
      // Refresh page to trigger setup flow
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setResetting(false);
    }
  };

  const startNewInterview = () => {
    navigate('/schedule');
  };

  const joinInterview = (interviewId: string) => {
    navigate(`/interview/${interviewId}`);
  };

  const reviewInterview = (interviewId: string) => {
    navigate(`/review/${interviewId}`);
  };

  const updateApplicationStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'applications', appId), { status });
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const handleEditJob = (job: any) => {
    setNewJob({
      title: job.title || '',
      description: job.description || '',
      location: job.location || '',
      type: job.type || 'Full-time',
      salaryRange: job.salaryRange || ''
    });
    setEditingJobId(job.id);
    setShowJobForm(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setDeletingJobId(null);
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("Failed to delete job.");
    }
  };

  useEffect(() => {
    if (!user || !profile) return;

    if (profile.role === 'company') {
      const qRequests = query(
        collection(db, 'interestRequests'),
        where('companyId', '==', user.uid)
      );
      const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        reqs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(reqs);
        setLoading(false);
      }, (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'interestRequests');
      });

      const qJobs = query(
        collection(db, 'jobs'),
        where('companyId', '==', user.uid)
      );
      const unsubscribeJobs = onSnapshot(qJobs, (snapshot) => {
        const fetchedJobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedJobs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setJobs(fetchedJobs);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'jobs');
      });

      const qApps = query(
        collection(db, 'applications'),
        where('companyId', '==', user.uid)
      );
      const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        apps.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setApplications(apps);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'applications');
      });

      return () => {
        unsubscribeRequests();
        unsubscribeJobs();
        unsubscribeApps();
      };
    } else {
      const qInterviews = query(
        collection(db, 'interviews'),
        where(profile.role === 'candidate' ? 'candidateId' : 'interviewerId', '==', user.uid)
      );

      const unsubscribeInterviews = onSnapshot(qInterviews, (snapshot) => {
        const ints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        ints.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInterviews(ints);
        setLoading(false);
      }, (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'interviews');
      });

      if (profile.role === 'candidate') {
        const qRequests = query(
          collection(db, 'interestRequests'),
          where('candidateId', '==', user.uid)
        );
        const unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
          const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          reqs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setRequests(reqs);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'interestRequests');
        });

        const qApps = query(
          collection(db, 'applications'),
          where('candidateId', '==', user.uid)
        );
        const unsubscribeApps = onSnapshot(qApps, (snapshot) => {
          const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          apps.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setApplications(apps);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'applications');
        });
        
        return () => {
          unsubscribeInterviews();
          unsubscribeRequests();
          unsubscribeApps();
        };
      }

      return unsubscribeInterviews;
    }
  }, [user, profile]);

  if (!profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100"
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="text-indigo-600 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600 mb-8">Please select your role to continue setting up your profile.</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => setRole('candidate')}
              className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left flex items-center group"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-600 transition-colors">
                <User className="w-5 h-5 text-indigo-600 group-hover:text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900">I'm a Candidate</div>
                <div className="text-xs text-gray-500">I want to record interviews and get hired.</div>
              </div>
            </button>
            <button 
              onClick={() => setRole('company')}
              className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left flex items-center group"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-emerald-600 transition-colors">
                <Briefcase className="w-5 h-5 text-emerald-600 group-hover:text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900">I'm a Company</div>
                <div className="text-xs text-gray-500">I want to find and hire top talent.</div>
              </div>
            </button>
            <button 
              onClick={() => setRole('interviewer')}
              className="w-full p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left flex items-center group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-600 transition-colors">
                <Star className="w-5 h-5 text-blue-600 group-hover:text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900">I'm an Interviewer</div>
                <div className="text-xs text-gray-500">I want to conduct interviews and rate candidates.</div>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {profile.displayName}!</h1>
          <p className="text-gray-600 mt-1">Manage your interviews and profile details here.</p>
        </div>
        <div className="flex items-center space-x-4">
          {profile.role === 'candidate' && (
            <button 
              onClick={startNewInterview}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Interview
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {profile.role === 'company' ? 'Interest Requests' : 'Recent Interviews'}
              </h2>
              <Link to={profile.role === 'company' ? "/requests" : "/interviews"} className="text-indigo-600 font-medium text-sm hover:underline">View All</Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : profile.role === 'company' ? (
              requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <motion.div 
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                          <Briefcase className="text-emerald-600 w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Request to {req.candidateName || 'Candidate'}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(req.createdAt).toLocaleDateString()}
                            <span className="mx-2">•</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 
                              req.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          {req.status === 'accepted' && req.candidateEmail && (
                            <div className="mt-2 text-sm text-indigo-600 font-medium">
                              Contact: <a href={`mailto:${req.candidateEmail}`} className="hover:underline">{req.candidateEmail}</a>
                            </div>
                          )}
                        </div>
                      </div>
                      <Link to={`/portfolio/${req.candidateId}`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
                        View Portfolio
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900">No requests sent</h3>
                  <p className="text-gray-500 mb-6">Search for candidates and send them an interest request.</p>
                  <Link to="/search" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium inline-block">
                    Search Candidates
                  </Link>
                </div>
              )
            ) : interviews.length > 0 ? (
              <div className="space-y-4">
                {interviews.map((interview) => (
                  <motion.div 
                    key={interview.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <Video className="text-indigo-600 w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">Technical Interview - React</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {interview.startTime?.toDate ? interview.startTime.toDate().toLocaleString() : new Date(interview.createdAt).toLocaleDateString()}
                            <span className="mx-2">•</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              interview.status === 'reviewed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {interview.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {interview.status === 'scheduled' && (
                          <button 
                            onClick={() => joinInterview(interview.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
                          >
                            Join
                          </button>
                        )}
                        {(interview.status === 'scheduled' || interview.status === 'completed') && profile.role === 'interviewer' && (
                          <button 
                            onClick={() => reviewInterview(interview.id)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
                          >
                            Review
                          </button>
                        )}
                        {interview.status === 'reviewed' && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-600">{interview.aiScore}/10</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">AI Score</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No interviews yet</h3>
                <p className="text-gray-500 mb-6">Record your first interview to build your portfolio.</p>
                {profile.role === 'candidate' && (
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium">
                    Schedule Now
                  </button>
                )}
              </div>
            )}
          </section>

          {profile.role === 'company' && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Job Postings</h2>
                <button 
                  onClick={() => setShowJobForm(!showJobForm)}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-sm hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post a Job
                </button>
              </div>

              {showJobForm && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const { addDoc, updateDoc, collection, doc } = await import('firebase/firestore');
                      if (editingJobId) {
                        await updateDoc(doc(db, 'jobs', editingJobId), {
                          ...newJob,
                          updatedAt: new Date().toISOString()
                        });
                      } else {
                        await addDoc(collection(db, 'jobs'), {
                          ...newJob,
                          companyId: user.uid,
                          companyName: profile.companyName || profile.displayName || user.displayName,
                          status: 'open',
                          createdAt: new Date().toISOString()
                        });
                      }
                      setShowJobForm(false);
                      setEditingJobId(null);
                      setNewJob({ title: '', description: '', location: '', type: 'Full-time', salaryRange: '' });
                    } catch (error) {
                      console.error("Error saving job:", error);
                      alert("Failed to save job.");
                    }
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                      <input required type="text" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Senior Frontend Engineer" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                      <input required type="text" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Remote, New York" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Job Type</label>
                      <select value={newJob.type} onChange={e => setNewJob({...newJob, type: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                        <option>Full-time</option>
                        <option>Part-time</option>
                        <option>Contract</option>
                        <option>Internship</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Salary Range (Optional)</label>
                      <input type="text" value={newJob.salaryRange} onChange={e => setNewJob({...newJob, salaryRange: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. $120k - $150k" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                    <textarea required value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} rows={4} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Describe the role and requirements..."></textarea>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => { setShowJobForm(false); setEditingJobId(null); }} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                      {editingJobId ? 'Update Job' : 'Post Job'}
                    </button>
                  </div>
                </motion.form>
              )}

              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map(job => (
                    <div key={job.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                        <div className="text-sm text-gray-500 mt-1">{job.location} • {job.type}</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                          {applications.filter(a => a.jobId === job.id).length} Applications
                        </div>
                        <div className="flex items-center space-x-1">
                          <button 
                            onClick={() => handleEditJob(job)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Job"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeletingJobId(job.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Job"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500">You haven't posted any jobs yet.</p>
                </div>
              )}

              {/* Delete Confirmation Modal */}
              <AnimatePresence>
                {deletingJobId && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl"
                    >
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                        <Trash2 className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Job Posting?</h3>
                      <p className="text-gray-500 mb-8 text-sm">
                        Are you sure you want to delete this job? This action cannot be undone and all associated applications will remain but as orphaned.
                      </p>
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => setDeletingJobId(null)}
                          className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleDeleteJob(deletingJobId)}
                          className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </section>
          )}

          {profile.role === 'company' && applications.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Applications Received</h2>
              </div>
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{app.candidateName}</h3>
                      <div className="text-sm text-gray-500 mt-1">Applied for: <span className="font-medium text-gray-700">{app.jobTitle}</span></div>
                      {app.status === 'accepted' && (
                        <div className="mt-2 flex items-center text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-lg w-fit border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Email: {app.candidateEmail}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Link to={`/portfolio/${app.candidateId}`} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
                        View Portfolio
                      </Link>
                      
                      {app.status === 'accepted' ? (
                        <span className="px-4 py-2 text-emerald-600 font-bold text-sm bg-emerald-50 border border-emerald-100 rounded-xl">Accepted</span>
                      ) : app.status === 'rejected' ? (
                        <span className="px-4 py-2 text-red-500 font-bold text-sm bg-red-50 border border-red-100 rounded-xl">Rejected</span>
                      ) : (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => updateApplicationStatus(app.id, 'accepted')}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-100"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => updateApplicationStatus(app.id, 'rejected')}
                            className="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {profile.role === 'candidate' && (
            <>
              {/* Pending Applications */}
              <section className="mt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Pending Applications</h2>
                </div>
                <div className="space-y-4">
                  {applications.filter(a => !a.status || a.status === 'pending').length > 0 ? (
                    applications.filter(a => !a.status || a.status === 'pending').map((app) => (
                      <motion.div 
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Briefcase className="text-indigo-600 w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{app.jobTitle} at {app.companyName}</h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              Applied {new Date(app.createdAt).toLocaleDateString()}
                              <span className="mx-2">•</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700">
                                Pending
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center p-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-500">
                       <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-20 text-gray-900" />
                      <p className="font-medium text-sm">No pending applications</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Accepted Applications */}
              {applications.some(a => a.status === 'accepted') && (
                <section className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-emerald-700">Accepted Jobs</h2>
                  </div>
                  <div className="space-y-4">
                    {applications.filter(a => a.status === 'accepted').map((app) => (
                      <motion.div 
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <CheckCircle className="text-emerald-600 w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-emerald-900">{app.jobTitle} at {app.companyName}</h3>
                            <div className="text-sm text-emerald-600 font-medium">Selected for further discussion!</div>
                          </div>
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">Accepted</div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Rejected Applications */}
              {applications.some(a => a.status === 'rejected') && (
                <section className="mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-500">Rejected Jobs</h2>
                  </div>
                  <div className="space-y-4">
                    {applications.filter(a => a.status === 'rejected').map((app) => (
                      <motion.div 
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between opacity-60 grayscale"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
                            <Briefcase className="text-gray-400 w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-500 line-through">{app.jobTitle} at {app.companyName}</h3>
                            <div className="text-xs text-gray-400">Application not selected</div>
                          </div>
                        </div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400 border border-gray-200 px-3 py-1 rounded-full">Rejected</div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {profile.role === 'candidate' && requests.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Company Requests</h2>
              </div>
              <div className="space-y-4">
                {requests.map((req) => (
                  <motion.div 
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Briefcase className="text-emerald-600 w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{req.companyName || 'Company'} Interest</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(req.createdAt).toLocaleDateString()}
                          <span className="mx-2">•</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 
                            req.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        {req.status === 'accepted' && req.companyEmail && (
                          <div className="mt-2 text-sm text-indigo-600 font-medium">
                            Contact: <a href={`mailto:${req.companyEmail}`} className="hover:underline">{req.companyEmail}</a>
                          </div>
                        )}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={async () => {
                            const { updateDoc, doc } = await import('firebase/firestore');
                            await updateDoc(doc(db, 'interestRequests', req.id), { status: 'accepted' });
                          }}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={async () => {
                            const { updateDoc, doc } = await import('firebase/firestore');
                            await updateDoc(doc(db, 'interestRequests', req.id), { status: 'declined' });
                          }}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-4 mb-6">
              <img src={profile.photoURL} alt="" className="w-16 h-16 rounded-2xl border-2 border-indigo-50" />
              <div>
                <h3 className="font-bold text-gray-900">{profile.displayName}</h3>
                <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Portfolio Link</div>
                <div className="text-sm font-medium text-indigo-600 truncate">
                  interviewportfolio.com/p/{user.uid}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-indigo-600">{interviews.length}</div>
                  <div className="text-[10px] text-indigo-400 font-bold uppercase">Interviews</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-emerald-600">0</div>
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">Views</div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
              <button 
                onClick={handleEditProfileClick}
                className="w-full flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium"
              >
                <Settings className="w-4 h-4 mr-3" />
                Edit Profile
              </button>
              <button 
                onClick={handleResetProfile}
                disabled={resetting}
                className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Settings className="w-4 h-4 mr-3" />
                {resetting ? 'Resetting...' : 'Reset Profile'}
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </section>

          {(profile.role === 'admin' || user?.email === 'revanthkumar.0709@gmail.com') && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 p-6 rounded-3xl text-white shadow-xl shadow-gray-200 border border-gray-800"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-lg">Developer Tools</h3>
              </div>
              <p className="text-gray-400 text-xs mb-6">Switch between roles instantly for debugging and testing different system views.</p>
              
              <div className="space-y-2">
                {(['candidate', 'interviewer', 'company', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => switchProfileRole(r)}
                    disabled={profile.role === r}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                      profile.role === r 
                        ? 'bg-gray-800 border-transparent text-gray-500 cursor-not-allowed'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span>{r.charAt(0).toUpperCase() + r.slice(1)} View</span>
                    {profile.role === r && <CheckCircle className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </motion.section>
          )}

          {profile.role === 'candidate' && (
            <section className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100">
              <h3 className="font-bold text-lg mb-2">Get Verified</h3>
              <p className="text-indigo-100 text-sm mb-6">Get your skills verified by top industry experts and stand out to recruiters.</p>
              <button 
                onClick={() => alert('Expert review booking is coming soon! Our team will contact you for scheduling.')}
                className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
              >
                Book Expert Review
              </button>
            </section>
          )}
        </div>
      </div>

      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setShowEditProfile(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                  <input required type="text" value={editProfileData.displayName} onChange={e => setEditProfileData({...editProfileData, displayName: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                
                {profile.role === 'company' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                      <input required type="text" value={editProfileData.companyName} onChange={e => setEditProfileData({...editProfileData, companyName: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Industry</label>
                      <input type="text" value={editProfileData.industry} onChange={e => setEditProfileData({...editProfileData, industry: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Company Size</label>
                      <input type="text" value={editProfileData.companySize} onChange={e => setEditProfileData({...editProfileData, companySize: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </>
                )}

                {profile.role === 'candidate' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Current Status / Bio</label>
                      <input type="text" value={editProfileData.bio} onChange={e => setEditProfileData({...editProfileData, bio: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                      <input type="text" value={editProfileData.location} onChange={e => setEditProfileData({...editProfileData, location: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Years of Experience</label>
                      <input type="number" value={editProfileData.yearsOfExperience} onChange={e => setEditProfileData({...editProfileData, yearsOfExperience: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Skills (comma separated)</label>
                      <input type="text" value={editProfileData.skills} onChange={e => setEditProfileData({...editProfileData, skills: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Domains (comma separated)</label>
                      <input type="text" value={editProfileData.domains} onChange={e => setEditProfileData({...editProfileData, domains: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Languages (comma separated)</label>
                      <input type="text" value={editProfileData.languages} onChange={e => setEditProfileData({...editProfileData, languages: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </>
                )}

                {profile.role === 'interviewer' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Job Title</label>
                      <input type="text" value={editProfileData.jobTitle} onChange={e => setEditProfileData({...editProfileData, jobTitle: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Company</label>
                      <input type="text" value={editProfileData.company} onChange={e => setEditProfileData({...editProfileData, company: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Years of Experience</label>
                      <input type="number" value={editProfileData.yearsOfExperience} onChange={e => setEditProfileData({...editProfileData, yearsOfExperience: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Domains (comma separated)</label>
                      <input type="text" value={editProfileData.domains} onChange={e => setEditProfileData({...editProfileData, domains: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Languages (comma separated)</label>
                      <input type="text" value={editProfileData.languages} onChange={e => setEditProfileData({...editProfileData, languages: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setShowEditProfile(false)} className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
