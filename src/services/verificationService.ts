// Verification Service for Admin & Institutional verification workflows
import { db, type StoredUser } from './db';
import type { VerificationRequest, VerificationStatus, UserRole } from '../types';

export interface VerificationFilter {
  role?: UserRole;
  status?: VerificationStatus;
  search?: string;
}

export const verificationService = {
  getRequests(filters?: VerificationFilter): VerificationRequest[] {
    let requests = db.getVerificationRequests();

    if (filters?.role) {
      requests = requests.filter((r) => r.role === filters.role);
    }
    if (filters?.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      requests = requests.filter(
        (r) =>
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          (r.organizationName && r.organizationName.toLowerCase().includes(q))
      );
    }
    return requests;
  },

  getRequestById(id: string): VerificationRequest | null {
    return db.getVerificationRequestById(id);
  },

  getRequestByUserId(userId: string): VerificationRequest | null {
    return db.getVerificationRequestByUserId(userId);
  },

  approveRequest(
    requestId: string,
    reviewer: { id: string; name: string; email: string; role: UserRole },
    notes?: string
  ): { success: boolean; message: string; user?: StoredUser } {
    const req = db.getVerificationRequestById(requestId);
    if (!req) return { success: false, message: 'Verification request not found.' };

    const user = db.getUserById(req.userId);
    if (!user) return { success: false, message: 'Target user account not found.' };

    const now = new Date().toISOString();

    // Update Request
    const updatedDocuments = req.documents.map((d) => ({
      ...d,
      status: 'verified' as const,
    }));

    db.updateVerificationRequest(requestId, {
      status: 'approved',
      reviewedBy: reviewer.name,
      reviewedAt: now,
      reviewerNotes: notes || 'Verified and approved by administrator.',
      documents: updatedDocuments,
    });

    // Update User
    const updatedUser = db.updateUser(user.id, {
      status: 'active',
      isVerified: true,
      statusReason: undefined,
      rejectionReason: undefined,
    });

    // Log Action
    db.logAction(
      'VERIFICATION_APPROVED',
      reviewer,
      `Approved verification for ${user.name} (${user.email}, ${user.role}). Notes: ${notes || 'None'}`,
      { requestId, targetUserId: user.id }
    );

    return { success: true, message: `Account for ${user.name} has been verified and activated.`, user: updatedUser || undefined };
  },

  rejectRequest(
    requestId: string,
    reviewer: { id: string; name: string; email: string; role: UserRole },
    reason: string,
    notes?: string
  ): { success: boolean; message: string; user?: StoredUser } {
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'A clear rejection reason of at least 5 characters is required.' };
    }

    const req = db.getVerificationRequestById(requestId);
    if (!req) return { success: false, message: 'Verification request not found.' };

    const user = db.getUserById(req.userId);
    if (!user) return { success: false, message: 'Target user account not found.' };

    const now = new Date().toISOString();

    // Update Request
    const updatedDocuments = req.documents.map((d) => ({
      ...d,
      status: 'rejected' as const,
    }));

    db.updateVerificationRequest(requestId, {
      status: 'rejected',
      rejectionReason: reason.trim(),
      reviewedBy: reviewer.name,
      reviewedAt: now,
      reviewerNotes: notes,
      documents: updatedDocuments,
    });

    // Update User
    const updatedUser = db.updateUser(user.id, {
      status: 'rejected',
      isVerified: false,
      statusReason: reason.trim(),
      rejectionReason: reason.trim(),
    });

    // Log Action
    db.logAction(
      'VERIFICATION_REJECTED',
      reviewer,
      `Rejected verification for ${user.name} (${user.email}, ${user.role}). Reason: ${reason}`,
      { requestId, targetUserId: user.id, reason }
    );

    return { success: true, message: `Verification request rejected. Reason recorded.`, user: updatedUser || undefined };
  },

  requestMoreInfo(
    requestId: string,
    reviewer: { id: string; name: string; email: string; role: UserRole },
    requestedInfo: string
  ): { success: boolean; message: string } {
    if (!requestedInfo || requestedInfo.trim().length < 5) {
      return { success: false, message: 'Please specify what additional documentation or info is needed.' };
    }

    const req = db.getVerificationRequestById(requestId);
    if (!req) return { success: false, message: 'Verification request not found.' };

    const user = db.getUserById(req.userId);
    if (!user) return { success: false, message: 'Target user account not found.' };

    const now = new Date().toISOString();

    db.updateVerificationRequest(requestId, {
      status: 'info_requested',
      requestedInfo: requestedInfo.trim(),
      reviewedBy: reviewer.name,
      reviewedAt: now,
    });

    db.updateUser(user.id, {
      statusReason: `Additional information requested: ${requestedInfo.trim()}`,
    });

    db.logAction(
      'VERIFICATION_INFO_REQUESTED',
      reviewer,
      `Requested additional information for ${user.name} (${user.email}): ${requestedInfo}`,
      { requestId, targetUserId: user.id, requestedInfo }
    );

    return { success: true, message: 'Additional information request sent to the applicant.' };
  },

  suspendAccount(
    userId: string,
    admin: { id: string; name: string; email: string; role: UserRole },
    reason: string
  ): { success: boolean; message: string } {
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'A valid reason for suspension is required.' };
    }

    const user = db.getUserById(userId);
    if (!user) return { success: false, message: 'User not found.' };

    db.updateUser(userId, {
      status: 'suspended',
      statusReason: reason.trim(),
    });

    db.logAction(
      'ACCOUNT_SUSPENDED',
      admin,
      `Account suspended for ${user.name} (${user.email}). Reason: ${reason}`,
      { targetUserId: userId, reason }
    );

    return { success: true, message: `Account for ${user.name} has been suspended.` };
  },

  reactivateAccount(
    userId: string,
    admin: { id: string; name: string; email: string; role: UserRole }
  ): { success: boolean; message: string } {
    const user = db.getUserById(userId);
    if (!user) return { success: false, message: 'User not found.' };

    db.updateUser(userId, {
      status: 'active',
      statusReason: undefined,
    });

    db.logAction(
      'ACCOUNT_REACTIVATED',
      admin,
      `Account reactivated for ${user.name} (${user.email}) by ${admin.name}`,
      { targetUserId: userId }
    );

    return { success: true, message: `Account for ${user.name} has been restored to active status.` };
  },
};
