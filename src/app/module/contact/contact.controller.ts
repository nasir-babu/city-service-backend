import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";

import { sendResponse } from "../../utils/sendResponse";
import { contactService } from "./contact.service";

const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await contactService.createContactMessage(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Message sent successfully! We will get back to you soon.",
    data: result,
  });
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const result = await contactService.getAllContactMessages();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Contact messages retrieved successfully",
    data: result,
  });
});

const updateContactStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await contactService.updateContactStatus(id as string, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Contact message status updated successfully",
    data: result,
  });
});

const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await contactService.deleteContactMessage(id as string);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Contact message deleted successfully",
    data: result,
  });
});

export const contactController = {
  createContact,
  getAllContacts,
  updateContactStatus,
  deleteContact,
};
