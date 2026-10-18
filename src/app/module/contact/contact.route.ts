import { Router } from "express";
import { Role } from "../../../generated/prisma";
import { auth } from "../../middleware/checkAuth";
import { contactController } from "./contact.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { ContactValidation } from "./contact.validaton";

const router = Router();

router.post(
  "/",
  validateRequest(ContactValidation.CreateContactMessageZodSchema),
  contactController.createContact,
);

router.get(
  "/",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  contactController.getAllContacts,
);
router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ContactValidation.UpdateContactStatusZodSchema),
  contactController.updateContactStatus,
);
router.delete(
  "/:id",
  auth(Role.ADMIN, Role.SUPER_ADMIN),
  contactController.deleteContact,
);

export const ContactRoutes = router;
