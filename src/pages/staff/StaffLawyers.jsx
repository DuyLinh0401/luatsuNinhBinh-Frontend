import React, { useState, useEffect } from 'react';
import lawyerService from '../../services/lawyerService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StaffLawyers = () => {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const data = await lawyerService.getLawyers();
        setLawyers(data.items);
      } catch (error) {
        console.error('Error fetching lawyers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Danh sách luật sư</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lawyers.map((lawyer) => (
          <div key={lawyer.id} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-lg">{lawyer.name}</h3>
            <p className="text-gray-600">{lawyer.position}</p>
            <p className="text-sm text-blue-600 mt-2">{lawyer.specialization}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffLawyers;