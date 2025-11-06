import { getAutoInsights } from "./analytics/autoInsights.controller";
import { saveDashboard, getDashboards, getDashboardById } from "./analytics/dashboard.controller";
import { getDeliveryRegionTrend } from "./analytics/deliveryRegionTrend.controller"
import { getLostButLoyal } from "./analytics/lostButLoyal.controller";
import { getPivotFieldValues, runPivot } from "./analytics/pivot.controller";
import { getTopProducts } from "./analytics/topProducts.controller";

export {
  saveDashboard,
  getDashboardById,
  getDashboards,
  getDeliveryRegionTrend,
  getLostButLoyal,
  getTopProducts,
  getAutoInsights,
  runPivot,
  getPivotFieldValues,
};
