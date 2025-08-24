import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Shield, CheckCircle, XCircle } from 'lucide-react';
import Button from '../UI/Button';
import api from '../../services/api';

interface PendingUser {
  id: number;
  email: string;
  name: string;
  registrationDate: string;
  isApproved: boolean;
  height?: number;
  weight?: number;
  fitnessGoals?: string;
}

const AdminPanel: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserApproval = async (userId: number, approve: boolean) => {
    setActionLoading(userId);
    try {
      await api.put(`/admin/users/${userId}/${approve ? 'approve' : 'reject'}`);
      await fetchPendingUsers();
    } catch (error) {
      console.error(`Failed to ${approve ? 'approve' : 'reject'} user:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const UserCard: React.FC<{ user: PendingUser }> = ({ user }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
          <p className="text-gray-600">{user.email}</p>
          <p className="text-sm text-gray-500">
            Registered: {new Date(user.registrationDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center">
          {user.isApproved ? (
            <div className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Approved</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
              <XCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Pending</span>
            </div>
          )}
        </div>
      </div>

      {/* User Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {user.height && (
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-sm text-gray-600 font-medium">Height</p>
            <p className="text-lg font-semibold text-gray-900">{user.height} cm</p>
          </div>
        )}
        {user.weight && (
          <div className="bg-gray-50 p-3 rounded-xl">
            <p className="text-sm text-gray-600 font-medium">Weight</p>
            <p className="text-lg font-semibold text-gray-900">{user.weight} kg</p>
          </div>
        )}
        <div className="bg-gray-50 p-3 rounded-xl">
          <p className="text-sm text-gray-600 font-medium">BMI</p>
          <p className="text-lg font-semibold text-gray-900">
            {user.height && user.weight 
              ? ((user.weight / Math.pow(user.height / 100, 2)).toFixed(1))
              : 'N/A'
            }
          </p>
        </div>
      </div>

      {user.fitnessGoals && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 font-medium mb-2">Fitness Goals</p>
          <p className="text-gray-800 bg-gray-50 p-3 rounded-xl">{user.fitnessGoals}</p>
        </div>
      )}

      {/* Action Buttons */}
      {!user.isApproved && (
        <div className="flex gap-3">
          <Button
            onClick={() => handleUserApproval(user.id, true)}
            loading={actionLoading === user.id}
            icon={UserCheck}
            className="flex-1"
          >
            Approve User
          </Button>
          <Button
            onClick={() => handleUserApproval(user.id, false)}
            loading={actionLoading === user.id}
            variant="outline"
            icon={UserX}
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );

  const stats = {
    totalUsers: pendingUsers.length,
    pendingUsers: pendingUsers.filter(user => !user.isApproved).length,
    approvedUsers: pendingUsers.filter(user => user.isApproved).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Shield className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-600">Manage user registrations and approvals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Pending Approval</p>
                <p className="text-3xl font-bold">{stats.pendingUsers}</p>
              </div>
              <UserX className="h-8 w-8 text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Approved Users</p>
                <p className="text-3xl font-bold">{stats.approvedUsers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-200" />
            </div>
          </div>
        </div>

        {/* Users List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            User Management ({pendingUsers.filter(user => !user.isApproved).length} pending approval)
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">No user registrations to review at this time.</p>
            </div>
          ) : (
            <div>
              {/* Pending Users First */}
              {pendingUsers.filter(user => !user.isApproved).map(user => (
                <UserCard key={user.id} user={user} />
              ))}
              
              {/* Approved Users */}
              {pendingUsers.filter(user => user.isApproved).length > 0 && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Approved Users</h3>
                  {pendingUsers.filter(user => user.isApproved).map(user => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;