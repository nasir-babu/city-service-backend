import { z } from "zod";
import { ContactStatus } from "../../../generated/prisma/enums";

const CreateContactMessageZodSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please provide a valid email address." }),
  subject: z
    .string()
    .min(3, { message: "Subject must be at least 3 characters long." })
    .optional(),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters long." }),
});

const UpdateContactStatusZodSchema = z.object({
  status: z.enum([
    ContactStatus.UNREAD,
    ContactStatus.READ,
    ContactStatus.REPLIED,
    ContactStatus.ARCHIVED,
  ]),
});

export const ContactValidation = {
  CreateContactMessageZodSchema,
  UpdateContactStatusZodSchema,
};
