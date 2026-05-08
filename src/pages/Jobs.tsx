import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { Briefcase, MapPin, DollarSign, Clock, Search as SearchIcon, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Jobs: React.FC = () => {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'jobs'), where('status', '==', 'open'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'jobs');
    });

    if (profile?.role === 'candidate') {
      const appQ = query(collection(db, 'applications'), where('candidateId', '==', user.uid));
      getDocs(appQ).then(snap => {
        setApplications(snap.docs.map(doc => doc.data().jobId));
      }).catch(err => console.error("Failed to fetch applications", err));
    }

    return unsubscribe;
  }, [user, profile]);

  const handleApply = async (job: any) => {
    if (!user || profile?.role !== 'candidate') return;
    setApplyingTo(job.id);
    try {
      await addDoc(collection(db, 'applications'), {
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        candidateId: user.uid,
        candidateName: profile.displayName || user.displayName,
        candidateEmail: user.email,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setApplications(prev => [...prev, job.id]);
    } catch (error) {
      console.error("Error applying to job:", error);
      alert("Failed to submit application.");
    } finally {
      setApplyingTo(null);
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <Briefcase className="text-indigo-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign in to view jobs</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          You must be signed in to browse and apply for open positions.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Job Board</h1>
        <p className="text-lg text-gray-600">Find and apply to top roles using your verified interview portfolio.</p>
      </div>

      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by job title, company, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none shadow-sm text-gray-900"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map(job => {
            const hasApplied = applications.includes(job.id);
            return (
              <motion.div 
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 lg:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
                  <div className="text-lg font-medium text-indigo-600 mb-4">{job.companyName}</div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                      {job.location || 'Remote'}
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1.5 text-gray-400" />
                      {job.type || 'Full-time'}
                    </div>
                    {job.salaryRange && (
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1.5 text-gray-400" />
                        {job.salaryRange}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 line-clamp-2">{job.description}</p>
                </div>
                
                <div className="flex-shrink-0 lg:w-48 flex flex-col justify-center">
                  {profile?.role === 'candidate' ? (
                    hasApplied ? (
                      <div className="flex items-center justify-center px-6 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-100">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Applied
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleApply(job)}
                        disabled={applyingTo === job.id}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {applyingTo === job.id ? 'Applying...' : 'Apply with Portfolio'}
                      </button>
                    )
                  ) : profile?.role === 'company' && job.companyId === user.uid ? (
                    <div className="text-center px-6 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold border border-gray-200">
                      Your Posting
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-[3rem] border border-gray-100 text-center">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500">Try adjusting your search terms or check back later.</p>
        </div>
      )}
    </div>
  );
};

export default Jobs;
