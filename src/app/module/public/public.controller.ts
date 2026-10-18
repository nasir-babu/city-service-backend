import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { PublicService } from "./public.service";
import { sendResponse } from "../../utils/sendResponse";

const getPublicDashboardStats = catchAsync(
  async (req: Request, res: Response) => {
    const result = await PublicService.getPublicDashboardStats();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Public dashboard stats retrieved successfully",
      data: result,
    });
  },
);

export const PublicController = {
  getPublicDashboardStats,
};
