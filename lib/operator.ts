// lib/operator.ts
"use server";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const getOperatorProfile = async () => {
  const user = await currentUser();

  if (!user || user.role !== "Operator") {
    return null;
  }

  const operatorProfile = await db.operatorProfile.findUnique({
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
  });

  return operatorProfile;
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