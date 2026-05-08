import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Video, Clock, ChevronLeft, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Interviews: React.FC = () => {
  const { user, profile } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const q = query(
      collection(db, 'interviews'),
      where(profile.role === 'candidate' ? 'candidateId' : 'interviewerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInterviews(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching interviews:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'interviews');
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
        <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
        <Link to="/dashboard" className="flex items-center text-indigo-600 font-medium hover:underline">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      {interviews.length > 0 ? (
        <div className="grid gap-6">
          {interviews.map((interview) => (
            <motion.div 
              key={interview.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {profile?.role === 'candidate' ? 'AI Assessment Interview' : `Candidate Assessment: ${interview.candidateName}`}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Completed on {new Date(interview.createdAt).toLocaleDateString()}
                    <span className="mx-2">•</span>
                    <div className="flex items-center">
                       <Star className="w-3 h-3 text-yellow-400 mr-1 fill-yellow-400" />
                       <span className="font-bold text-gray-700">{interview.score || '85'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link 
                  to={`/interview/${interview.id}`} 
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-100"
                >
                  View Details
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-gray-200 text-center">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No interviews recorded</h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            {profile?.role === 'candidate' 
              ? "You haven't recorded any interviews yet. Start your first session to get feedback!"
              : "No candidate interviews recorded yet."}
          </p>
          <Link to="/dashboard" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default Interviews;
