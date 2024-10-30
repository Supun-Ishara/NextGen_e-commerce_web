const express = require("express");
const {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updateaUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  userCart,
  getUserCart,
  createOrder,
  removeProductFromCart,
  updatedProductQuantityFromCart,
  getMyOrders,
  getallOrders,
  getOrderByUserId,
} = require("../controller/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const { checkout, paymentVerification } = require("../controller/paymentCtrl");
const router = express.Router();
router.post("/register", createUser);
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);
// router.put(
//   "/order/update-order/:id",
//   authMiddleware,
//   isAdmin,
//   updateOrderStatus
// );

router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUserCtrl);
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
// router.post("/cart/applycoupon", authMiddleware, applyCoupon);
router.post("/cart/create-order", authMiddleware, createOrder);
router.post("/order/checkout", authMiddleware, checkout);
router.post("/order/paymentVerification",authMiddleware, paymentVerification);

router.get("/all-users", getallUser);
router.get("/getmyorders", authMiddleware, getMyOrders);
 router.get("/getallorders", authMiddleware, isAdmin, getallOrders);
 router.post("/getorderbyuser/:id", authMiddleware, isAdmin, getOrderByUserId);
 

router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/wishlist", authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);
router.get("/:id", authMiddleware, isAdmin, getaUser);
// router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete(
  "/delete-product-cart/:cartItemId",
  authMiddleware,
  removeProductFromCart
);
router.put(
  "/update-product-cart/:cartItemId/:newQuantity",
  authMiddleware,
  updatedProductQuantityFromCart
);

router.delete("/:id", deleteaUser);
router.put("/edit-user", authMiddleware, updateaUser);
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);

module.exports = router;
