// lib/operator.ts
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { OperatorProfile } from "@prisma/client";

// Get active operator profile (with optional profileId for multi-business)
export const getOperatorProfile = async (profileId?: string) => {
  const user = await currentUser();

  if (!user || user.role !== "Operator") {
    return null;
  }

  // If specific profile requested
  if (profileId) {
    const profile = await db.operatorProfile.findUnique({
      where: {
        id: profileId,
        userId: user.id!,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
    return profile;
  }

  // Get first/most recent profile
  const profile = await db.operatorProfile.findFirst({
    where: {
      userId: user.id!,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return profile;
};

// Get all operator profiles for current user
export const getOperatorProfiles = async () => {
  const user = await currentUser();

  if (!user || user.role !== "Operator") {
    return [];
  }

  const profiles = await db.operatorProfile.findMany({
    where: {
      userId: user.id!,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return profiles;
};

// Check if user has any operator profiles
export const hasOperatorProfile = async () => {
  const user = await currentUser();

  if (!user) {
    return false;
  }

  const count = await db.operatorProfile.count({
    where: {
      userId: user.id!,
    },
  });

  return count > 0;
};

export const requireOperator = async () => {
  const profile = await getOperatorProfile();

  if (!profile) {
    throw new Error("Operator profile not found");
  }

  return profile;
};

export const requireApprovedOperator = async () => {
  const profile = await requireOperator();

  if (!profile.isApproved) {
    throw new Error("Operator account pending approval");
  }

  return profile;
};

// Get operator status
export type OperatorStatus =
  | "draft" // isApproved = false
  | "pending_review" // isApproved = false, docs submitted
  | "live" // isApproved = true, bank approved
  | "needs_bank" // isApproved = true, no bank
  | "bank_pending" // isApproved = true, bank pending
  | "bank_reverification";

export const getOperatorStatus = (operator: OperatorProfile): OperatorStatus => {
  // Not approved yet
  if (!operator.isApproved) {
    // Have they submitted docs?
    if (operator.verificationDocumentsSubmittedAt) {
      return "pending_review";
    }
    return "draft";
  }

  // Approved but no bank
  if (!operator.bankVerificationStatus) {
    return "needs_bank";
  }

  // Approved, bank pending
  if (operator.bankVerificationStatus === "Pending") {
    return "bank_pending";
  }

  // Approved, bank rejected
  if (operator.bankVerificationStatus === "Rejected") {
    return "needs_bank"; // Can resubmit
  }

  // Fully live!
  if (operator.bankVerificationStatus === "Approved") {
    return "live";
  }

  return "draft";
}

// Check if operator can create tours (always true, even in draft)
export const canCreateTours = (operator: OperatorProfile): boolean => {
  return true;
}

// Check if operator's tours are visible to customers
export const areToursVisible = (operator: OperatorProfile): boolean => {
  // Only live when BOTH approved
  return operator.isApproved && operator.bankVerificationStatus === "Approved";
}

// Check if operator can submit for verification
export const canGoLive = (operator: OperatorProfile): boolean => {
  // Can request to go live if they have all docs + bank
  return !!(
    operator.companyRegistrationDocument &&
    operator.idDocument &&
    operator.serviceAgreement &&
    operator.bankCode &&
    operator.accountNumber
  );
}


export function canEditVerificationDocs(operator: OperatorProfile): boolean {
  // Verification docs are locked once approved
  return !operator.isApproved;
}

export function canEditBankDetails(operator: OperatorProfile): boolean {
  // Bank details can always be edited, but triggers re-verification if approved
  return true;
}

export function canEditBusinessProfile(operator: OperatorProfile): boolean {
  // Business profile can always be edited
  return true;
}