import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Briefcase, Clock, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const InterestRequests: React.FC = () => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const q = query(
      collection(db, 'interestRequests'),
      where(profile.role === 'company' ? 'companyId' : 'candidateId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching requests:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'interestRequests');
    });

    return () => unsubscribe();
  }, [user, profile]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Interest Requests</h1>
        <Link to="/dashboard" className="flex items-center text-indigo-600 font-medium hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {requests.length > 0 ? (
        <div className="grid gap-6">
          {requests.map((req) => (
            <motion.div 
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${profile?.role === 'company' ? 'bg-emerald-50' : 'bg-indigo-50'} rounded-xl flex items-center justify-center`}>
                  <Briefcase className={`w-6 h-6 ${profile?.role === 'company' ? 'text-emerald-600' : 'text-indigo-600'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {profile?.role === 'company' ? `Request to ${req.candidateName}` : `Request from ${req.companyName}`}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Requested on {new Date(req.createdAt).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 
                      req.status === 'declined' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  {req.status === 'accepted' && (
                     <div className="mt-2 text-sm text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg w-fit">
                        {profile?.role === 'company' ? `Contact: ${req.candidateEmail}` : `Response: Interested!`}
                     </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link 
                  to={profile?.role === 'company' ? `/portfolio/${req.candidateId}` : `/dashboard`} 
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all border border-gray-200"
                >
                  {profile?.role === 'company' ? 'View Portfolio' : 'Dashboard'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No requests yet</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            {profile?.role === 'company' 
              ? "You haven't sent any interest requests yet. Find great candidates in the search."
              : "You haven't received any interest requests yet. Complete your portfolio to get noticed!"}
          </p>
          <Link to={profile?.role === 'company' ? "/search" : "/dashboard"} className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            {profile?.role === 'company' ? 'Search Candidates' : 'Go to Dashboard'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default InterestRequests;
