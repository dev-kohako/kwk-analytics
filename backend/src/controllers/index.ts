import { saveDashboard, getDashboards, getDashboardById } from "./analytics/dashboard.controller";
import { getDeliveryRegionTrend } from "./analytics/deliveryRegionTrend.controller"
import { getLostButLoyal } from "./analytics/lostButLoyal.controller";
import { getTopProducts } from "./analytics/topProducts.controller";

export {
  saveDashboard,
  getDashboardById,
  getDashboards,
  getDeliveryRegionTrend,
  getLostButLoyal,
  getTopProducts,
};
