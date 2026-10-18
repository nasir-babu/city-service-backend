import type { ContactStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const createContactMessage = async (payload: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) => {
  const result = await prisma.contactMessage.create({
    data: payload,
  });
  return result;
};

const getAllContactMessages = async () => {
  const result = await prisma.contactMessage.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const updateContactStatus = async (id: string, status: ContactStatus) => {
  const result = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
  return result;
};

const deleteContactMessage = async (id: string) => {
  const result = await prisma.contactMessage.update({
    where: { id },
    data: { isDeleted: true },
  });
  return result;
};

export const contactService = {
  createContactMessage,
  getAllContactMessages,
  updateContactStatus,
  deleteContactMessage,
};
