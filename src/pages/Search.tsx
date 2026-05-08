import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { Search as SearchIcon, Filter, MapPin, Star, Briefcase, ChevronRight, Users, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Search: React.FC = () => {
  const { user } = useAuth();
  const [searchType, setSearchType] = useState<'candidates' | 'jobs'>('candidates');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (searchType === 'candidates') {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'candidate'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setCandidates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'users');
      });

      return unsubscribe;
    } else {
      const q = query(
        collection(db, 'jobs'),
        where('status', '==', 'open'),
        limit(20)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }, (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'jobs');
      });

      return unsubscribe;
    }
  }, [user, searchType]);

  const filteredCandidates = candidates.filter(c => 
    c.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.skills?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredJobs = jobs.filter(j => 
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <SearchIcon className="text-indigo-600 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign in to search</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          To protect privacy and verified data, you must be signed in to browse our community.
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
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            {searchType === 'candidates' ? 'Find Top Talent' : 'Explore Opportunities'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            {searchType === 'candidates' 
              ? 'Search through verified interview portfolios of world-class candidates ready for their next role.' 
              : 'Discover elite job openings at forward-thinking companies looking for verified expertise.'}
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setSearchType('candidates')}
            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              searchType === 'candidates' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Candidates
          </button>
          <button
            onClick={() => setSearchType('jobs')}
            className={`flex items-center px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              searchType === 'jobs' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Jobs
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </h3>
              <button className="text-xs text-indigo-600 font-bold uppercase">Reset</button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Category</label>
                <div className="space-y-2">
                  {['Engineering', 'Design', 'Product', 'Marketing'].map(cat => (
                    <label key={cat} className="flex items-center group cursor-pointer">
                      <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Location</label>
                <select className="w-full rounded-xl border-gray-200 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                  <option>All Locations</option>
                  <option>Remote</option>
                  <option>San Francisco, CA</option>
                  <option>New York, NY</option>
                  <option>Austin, TX</option>
                </select>
              </div>

              {searchType === 'candidates' && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Minimum Rating</label>
                  <div className="flex items-center space-x-2">
                    <input type="range" min="0" max="10" step="0.5" className="w-full accent-indigo-600" />
                    <span className="text-sm font-bold text-indigo-600">8.0+</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-grow">
          <div className="relative mb-8">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder={searchType === 'candidates' ? "Search by name, skills, or role..." : "Search jobs, companies, or keywords..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-lg"
            />
          </div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-50 rounded-3xl animate-pulse border border-gray-100" />)}
              </motion.div>
            ) : searchType === 'candidates' ? (
              <motion.div 
                key="candidates"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <div 
                      key={candidate.id}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <img src={candidate.photoURL || `https://i.pravatar.cc/150?u=${candidate.id}`} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-50" />
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{candidate.displayName}</h3>
                            <div className="flex items-center text-sm text-gray-500 font-medium">
                              <MapPin className="w-3 h-3 mr-1" />
                              {candidate.location || 'Remote'}
                            </div>
                          </div>
                        </div>
                        <div className="bg-emerald-50 px-3 py-1 rounded-lg flex items-center text-emerald-700 font-bold text-sm">
                          <Star className="w-3 h-3 mr-1 fill-emerald-700" />
                          9.2
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {(candidate.skills || ['React', 'TypeScript', 'Node.js']).slice(0, 3).map((skill: string) => (
                          <span key={skill} className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-semibold text-gray-600">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                          <Briefcase className="w-3 h-3 mr-1" />
                          {candidate.yearsOfExperience ? `${candidate.yearsOfExperience}+ Years` : 'Expert'}
                        </div>
                        <Link 
                          to={`/portfolio/${candidate.id}`}
                          className="inline-flex items-center text-indigo-600 font-bold text-sm hover:translate-x-1 transition-transform"
                        >
                          View Portfolio
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                    <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No candidates found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search term.</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="jobs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <div 
                      key={job.id}
                      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm">
                            <Building className="text-indigo-600 w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                            <div className="text-sm text-indigo-600 font-bold">{job.companyName}</div>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-2 mb-6">
                        {job.description}
                      </p>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div className="flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider">
                          <MapPin className="w-3 h-3 mr-1" />
                          {job.location}
                        </div>
                        <Link 
                          to={`/jobs`}
                          className="inline-flex items-center text-indigo-600 font-bold text-sm hover:translate-x-1 transition-transform"
                        >
                          View Job Details
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm">
                    <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">No jobs found</h3>
                    <p className="text-gray-500">Try adjusting your filters or keywords.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Search;
