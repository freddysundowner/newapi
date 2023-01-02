const orderController = require("../controllers/orders");
const express = require("express");
const orderRouter = express.Router();

orderRouter
  .route("/:userId")
  .get(orderController.getAllOrdersByUserId)
  .post(orderController.addOrder);
orderRouter
  .route("/orders/:orderId")
  .get(orderController.getOrderById)
  .put(orderController.updateOrderById)
  .delete(orderController.deleteProductById);

orderRouter.route("/all/orders").get(orderController.getAllOrders);
orderRouter.route("/all/shop/:shopId").get(orderController.getOrderByShopId);
orderRouter
  .route("/all/get/products/:productId")
  .get(orderController.getOrderByProductId);

orderRouter
  .route("/paginated/user/:userId/:pagenumber")
  .get(orderController.getPaginatedOrdersByUserId);
orderRouter
  .route("/paginated/shop/:shopId/:pagenumber")
  .get(orderController.getPaginatedOrdersByShopId);

orderRouter.route("/cancelorder/:orderId").put(orderController.cancelOrder);
orderRouter
  .route("/finishorder/:orderId")
  .put(orderController.finishOrderAfterShipping);

orderRouter.route("/dashboard/orders").get(orderController.getDashboardOrdersAdmin);
orderRouter.route("/dashboard/orders/shopowner").get(orderController.getDashboardOrdersShopOwner);

orderRouter
  .route("/dashboard/orders/best-seller/chart")
  .get(orderController.bestSellerProductChart);
module.exports = orderRouter;
