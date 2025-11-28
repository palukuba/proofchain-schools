
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/supabase/studentService';
import type { StudentProfile } from '../types/database';
import { Language } from '../types';
import { useTranslation } from '../services/i18n';

interface StudentsProps {
  lang: Language;
}

interface StudentFormData {
  full_name: string;
  email: string;
  public_wallet?: string;
}

const Students: React.FC<StudentsProps> = ({ lang }) => {
  const t = useTranslation(lang);
  const { schoolProfile } = useAuth();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm<StudentFormData>();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await studentService.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (data: StudentFormData) => {
    try {
      // Generate a mock user_id and public_wallet for now
      // In production, you'd create the auth user first
      const mockUserId = 'student_' + Math.random().toString(36).substr(2, 9);
      const publicWallet = data.public_wallet || '0x' + Math.random().toString(16).substr(2, 40);

      await studentService.createStudent({
        user_id: mockUserId,
        full_name: data.full_name,
        email: data.email,
        public_wallet: publicWallet,
      });

      await loadStudents();
      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student');
    }
  };

  const handleDeleteStudent = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      await studentService.deleteStudent(userId);
      await loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // CSV import not yet implemented with Supabase
      alert('CSV import feature coming soon!');
    }
  };

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold">{t('students')}</h2>
        <div className="flex gap-2">
          <label className="btn btn-outline gap-2 cursor-pointer">
            <Upload size={18} />
            {t('importCsv')}
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} />
          </label>
          <button className="btn btn-primary gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      <div className="form-control w-full max-w-xs">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto card bg-base-100 shadow-xl">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200 text-base-content uppercase text-xs tracking-wider">
              <th>Full Name</th>
              <th>Email</th>
              <th>Wallet</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.user_id} className="hover group transition-colors">
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded-full w-8">
                        <span className="text-xs">{student.full_name.charAt(0)}</span>
                      </div>
                    </div>
                    <div className="font-bold">{student.full_name}</div>
                  </div>
                </td>
                <td className="text-sm opacity-80">{student.email}</td>
                <td className="font-mono text-xs opacity-70">{student.public_wallet.substring(0, 10)}...</td>
                <td className="text-sm opacity-70">{new Date(student.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteStudent(student.user_id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <Search size={48} className="mb-4" />
                    <h3 className="text-lg font-bold">No students found</h3>
                    <p className="text-sm">Try adjusting your search or add a new student.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add New Student</h3>
            <form onSubmit={handleSubmit(handleAddStudent)} className="flex flex-col gap-3">
              <input {...register('full_name', { required: true })} placeholder="Full Name" className="input input-bordered w-full" />
              <input {...register('email', { required: true })} type="email" placeholder="Email" className="input input-bordered w-full" />
              <input {...register('public_wallet')} placeholder="Wallet Address (optional)" className="input input-bordered w-full" />

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
