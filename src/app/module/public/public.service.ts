import { RequestStatus, Role } from "../../../generated/prisma";
import { prisma } from "../../lib/prisma";

const getPublicDashboardStats = async () => {
    const [
        totalCitizens,
        totalRequests,
        resolvedRequests,
        totalCategories,
    ] = await Promise.all([
        prisma.user.count({ where: { role: Role.CITIZEN } }),
        prisma.serviceRequest.count(),
        prisma.serviceRequest.count({ where: { status: RequestStatus.RESOLVED } }),
        prisma.category.count(),
    ]);

    return {
        users: {
            totalCitizens,
        },
        serviceRequests: {
            totalRequests,
            resolvedRequests,
        },
        categories: {
            totalCategories,
        },
    };
};

export const PublicService = {
    getPublicDashboardStats,
};