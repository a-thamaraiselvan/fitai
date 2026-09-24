import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Shield, CheckCircle, Ban, Key, Trash2 } from 'lucide-react';
import Button from '../UI/Button';
import Input from '../UI/Input';
import api from '../../services/api';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  registrationDate: string;
  isApproved: boolean;
  isSuspended: boolean;
  height?: number;
  weight?: number;
  fitnessGoals?: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  // Reset Password State
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { 
      const response = await api.get('/Admin/GetAllUsers'); 
      setUsers(response.data); 
    } catch (error) { 
      console.error('Failed to fetch users:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleUserApproval = async (userId: number, approve: boolean) => {
    setActionLoading(userId);
    try { 
      await api.put(`/Admin/${approve ? 'ApproveUser' : 'RejectUser'}/${userId}`); 
      await fetchUsers(); 
    } catch (error) { 
      console.error(`Failed to ${approve ? 'approve' : 'reject'} user:`, error); 
    } finally { 
      setActionLoading(null); 
    }
  };

  const handleSuspend = async (userId: number, suspend: boolean) => {
    if (suspend && !window.confirm('Are you sure you want to suspend this user?')) return;
    setActionLoading(userId);
    try {
      await api.put(`/Admin/SuspendUser/${userId}`, { suspend });
      await fetchUsers();
    } catch (error) {
      console.error(`Failed to ${suspend ? 'suspend' : 'unsuspend'} user:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setActionLoading(userId);
    try {
      await api.delete(`/Admin/DeleteUser/${userId}`);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !newPassword) return;
    setResetLoading(true);
    try {
      await api.put(`/Admin/ResetUserPassword/${resetUserId}`, { newPassword });
      alert('Password reset successfully');
      setResetUserId(null);
      setNewPassword('');
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const stats = {
    totalUsers: users.length,
    pendingUsers: users.filter(user => !user.isApproved).length,
    approvedUsers: users.filter(user => user.isApproved && !user.isSuspended).length,
    suspendedUsers: users.filter(user => user.isSuspended).length,
  };

  const pendingList = users.filter(user => !user.isApproved);
  const approvedList = users.filter(user => user.isApproved && !user.isSuspended);
  const suspendedList = users.filter(user => user.isSuspended);

  return (
    <div className="min-h-screen bg-ios-bg px-4 pt-14 pb-24">
      <div className="max-w-lg mx-auto ios-animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-7 w-7 text-ios-purple" strokeWidth={2} />
            <h1 className="ios-large-title text-gray-900">Admin</h1>
          </div>
          <p className="text-[15px] text-ios-gray1">Manage user registrations & accounts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'Total', value: stats.totalUsers, color: 'text-ios-blue', bg: 'bg-ios-blue/10', icon: Users },
            { label: 'Pending', value: stats.pendingUsers, color: 'text-ios-orange', bg: 'bg-ios-orange/10', icon: UserX },
            { label: 'Active', value: stats.approvedUsers, color: 'text-ios-green', bg: 'bg-ios-green/10', icon: UserCheck },
            { label: 'Suspended', value: stats.suspendedUsers, color: 'text-ios-red', bg: 'bg-ios-red/10', icon: Ban },
          ].map(stat => (
            <div key={stat.label} className="ios-card p-3 text-center">
              <div className={`w-8 h-8 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} strokeWidth={2.2} />
              </div>
              <p className={`text-[18px] font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-ios-gray2 mt-0.5 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Reset Password Modal */}
        {resetUserId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <h3 className="text-xl font-bold mb-4">Reset Password</h3>
              <form onSubmit={handleResetPassword}>
                <Input
                  type="password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <div className="flex gap-3 mt-6">
                  <Button type="button" variant="secondary" className="flex-1" onClick={() => setResetUserId(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" loading={resetLoading}>
                    Reset
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
        <div>
          {loading ? (
            <div className="ios-card py-10 text-center">
              <div className="w-8 h-8 rounded-full border-[3px] border-ios-gray5 border-t-ios-gray1 mx-auto mb-3"
                style={{ animation: 'ios-spin 0.8s linear infinite' }} />
              <p className="text-[14px] text-ios-gray1">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="ios-card py-12 text-center">
              <Users className="h-12 w-12 text-ios-gray3 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-[15px] font-medium text-gray-900 mb-1">No Users Found</p>
              <p className="text-[14px] text-ios-gray2">No registrations to review</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Pending Users */}
              {pendingList.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-2 ml-4">
                    Pending ({pendingList.length})
                  </p>
                  <div className="space-y-3">
                    {pendingList.map(user => (
                      <div key={user.id} className="ios-card p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-[16px] font-semibold text-gray-900">{user.name}</h3>
                            <p className="text-[13px] text-ios-gray1">{user.email}</p>
                            <p className="text-[12px] text-ios-gray2 mt-0.5">
                              Registered: {new Date(user.registrationDate).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-[12px] font-medium text-ios-orange bg-ios-orange/10 px-2.5 py-1 rounded-full">
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-2.5">
                          <Button onClick={() => handleUserApproval(user.id, true)} loading={actionLoading === user.id}
                            icon={UserCheck} className="flex-1" size="sm">Approve</Button>
                          <Button onClick={() => handleUserApproval(user.id, false)} loading={actionLoading === user.id}
                            variant="destructive" icon={UserX} className="flex-1" size="sm">Reject</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Users */}
              {approvedList.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-2 ml-4">
                    Active ({approvedList.length})
                  </p>
                  <div className="space-y-3">
                    {approvedList.map(user => (
                      <div key={user.id} className="ios-card p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-[15px] font-medium text-gray-900">{user.name}</h3>
                            <p className="text-[13px] text-ios-gray2">{user.email}</p>
                          </div>
                          <span className="text-[12px] font-medium text-ios-green bg-ios-green/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        </div>
                        <div className="flex gap-2 border-t border-ios-gray5 pt-3">
                          <Button onClick={() => setResetUserId(user.id)} variant="secondary" size="sm" icon={Key} className="flex-1" disabled={actionLoading === user.id}>
                            Reset Pass
                          </Button>
                          <Button onClick={() => handleSuspend(user.id, true)} variant="secondary" size="sm" icon={Ban} className="flex-1 text-ios-orange" loading={actionLoading === user.id}>
                            Suspend
                          </Button>
                          <Button onClick={() => handleDelete(user.id)} variant="secondary" size="sm" icon={Trash2} className="flex-1 text-ios-red" loading={actionLoading === user.id}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suspended Users */}
              {suspendedList.length > 0 && (
                <div>
                  <p className="text-[13px] font-medium text-ios-gray1 uppercase tracking-wide mb-2 ml-4">
                    Suspended ({suspendedList.length})
                  </p>
                  <div className="space-y-3">
                    {suspendedList.map(user => (
                      <div key={user.id} className="ios-card p-4 flex flex-col gap-3 opacity-75">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-[15px] font-medium text-gray-900 line-through">{user.name}</h3>
                            <p className="text-[13px] text-ios-gray2">{user.email}</p>
                          </div>
                          <span className="text-[12px] font-medium text-ios-red bg-ios-red/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Ban className="h-3 w-3" /> Suspended
                          </span>
                        </div>
                        <div className="flex gap-2 border-t border-ios-gray5 pt-3">
                          <Button onClick={() => handleSuspend(user.id, false)} variant="secondary" size="sm" icon={CheckCircle} className="flex-1 text-ios-green" loading={actionLoading === user.id}>
                            Unsuspend
                          </Button>
                          <Button onClick={() => handleDelete(user.id)} variant="secondary" size="sm" icon={Trash2} className="flex-1 text-ios-red" loading={actionLoading === user.id}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;