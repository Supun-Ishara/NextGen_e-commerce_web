const { generateToken } = require("../config/jwtToken");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");

const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("./emailCtrl");

//Create a User
const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({email:email});
    if (!findUser) {
       //Create a new User
       const newUser = await User.create(req.body);
       res.json(newUser);
    } else {
        throw new Error("User Already Exists.");
    //     res.json({
    //     msg: "User Already Exists",
    //     success: false,
    // });
}
});

//Login a user

const loginUserCtrl = asyncHandler(async (req, res) =>{
    const { email, password } = req.body;
    // check if user exists or not
    const findUser = await User.findOne({ email });
    if(findUser && await findUser.isPasswordMatched(password)){
        const refreshToken = await generateRefreshToken(findUser?._id)
        const updateuser = await User.findByIdAndUpdate(
            findUser.id, 
            {
            refreshToken: refreshToken,
        }, {new:true});
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 100,
        });        
        res.json({
            id: findUser?.id,
            firstname: findUser?.firstName,
            lastname: findUser?.lastName,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: generateToken(findUser?.id),
        });
    }else{
        throw new Error("Invalid Credentials")
    }
});

// admin login

const loginAdmin = asyncHandler(async (req, res) =>{
    const { email, password } = req.body;
    // check if user exists or not
    const findAdmin = await User.findOne({ email });
    if(findAdmin.role !== "admin") throw new Error("Not Authorised");
    if(findAdmin && await findAdmin.isPasswordMatched(password)){
        const refreshToken = await generateRefreshToken(findAdmin?._id)
        const updateuser = await User.findByIdAndUpdate(
            findAdmin.id, 
            {
            refreshToken: refreshToken,
        }, {new:true});
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 100,
        });        
        res.json({
            id: findAdmin?.id,
            firstname: findAdmin?.firstName,
            lastname: findAdmin?.lastName,
            email: findAdmin?.email,
            mobile: findAdmin?.mobile,
            token: generateToken(findAdmin?.id),
        });
    }else{
        throw new Error("Invalid Credentials")
    }
});

// handle refresh token 

const handleRefreshToken = asyncHandler(async (req, res) => {
   const cookie = req.cookies; 
   if(!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies.");
   const refreshToken = cookie.refreshToken;
   const user = await User.findOne({ refreshToken });
   if(!user) throw new Error("No Refresh token present in db or not matched");
   jwt.verify(
    refreshToken, 
    process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
        throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id)
    res.json({ accessToken })
   });
});

// logout functionality

const logout = asyncHandler(async (req, res) => {
   const cookie = req.cookies;
   if(!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies.");
   const refreshToken = cookie.refreshToken;
   const user = await User.findOne({ refreshToken });
   if(!user) {
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    return res.sendStatus(204); // forbidden
   }
   await User.findOneAndUpdate({refreshToken}, {
    refreshToken: "",
   });
   res.clearCookie("RefreshToken", {
    httpOnly: true,
    secure: true,
   });
   res.sendStatus(204); // forbidden
});

//Update a user

const updateaUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
      const updatedUser = await User.findByIdAndUpdate(_id, {
        firstname: req?.body?.firstName,
        lastname: req?.body?.lastName,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      }, {
        new: true,
      }
    );
    res.json(updatedUser);
    } catch (error) {
        throw new Error(error);
    }
});

// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
        const updatedUser = await User.findByIdAndUpdate(
         _id, 
        {
          address: req?.body?.address,
        }, 
        {
          new: true,
        }
      );
      res.json(updatedUser);
      } catch (error) {
          throw new Error(error);
      }
});

//Get all users

const getallUser = asyncHandler(async (req, res) =>{
    try{
      const getUsers = await User.find();
      res.json(getUsers);
    }
    catch(error){
        throw new Error(error)
    }
});

//Get a single user

const getaUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
        const getaUser = await User.findById(id);
        res.json({
            getaUser,
        });
    } 
    catch (error) {
        throw new Error(error);
    }
});

//Delete a single user

const deleteaUser = asyncHandler(async (req, res) => {
    console.log(req.params)
    const { id } = req.params;
    try {
        const getaUser = await User.findByIdAndDelete(id);
        res.json({
            getaUser,
        });
    } 
    catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler(async (req, res) => {
    const {id} = req.params;
    validateMongoDbId(id);
    try {
      const block = await User.findByIdAndUpdate(
        id,
        {
            isBlocked: true,
        },
        {
            new: true,
        }
      );
      res.json({
        message: "User Blocked"
      });
    } catch (error) {
        throw new Error(error);
    }
});
const unblockUser = asyncHandler(async (req, res) => {
    const {id} = req.params;
    validateMongoDbId(id);
    try {
      const unblock = await User.findByIdAndUpdate(
        id,
        {
            isBlocked: false,
        },
        {
            new: true,
        }
      );
      res.json({
        message: "User UnBlocked"
      });
    } catch (error) {
        throw new Error(error);
    }
});

const updatePassword = asyncHandler( async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongoDbId(_id);
    const user = await User.findById(_id);
        if(password) {
            user.password = password;
            const updatedPassword = await user.save();
            res.json(updatedPassword);
        } else {
            res.json(user);
        }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found with this email");
    try {
      const token = await user.createPasswordResetToken();
      await user.save();
      const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'>Click Here</>`;
      const data = {
        to: email,
        text: "Hey User",
        subject: "Forgot Password Link",
        htm: resetURL,
      };
      sendEmail(data);
      res.json(token);
    } catch (error) {
      throw new Error(error);
    }
  });

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    if(!user) throw new Error("Token Expired, Please try again later");
    user.password =password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
    }
    catch (error) {
        throw new Error(error);
    }
});

const userCart = asyncHandler(async (req, res) => {
    const { productId, color, quantity, price } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
      
      let newCart = await new Cart({
        userId:_id,
        productId,
        color,
        price,
        quantity
      }).save();
      res.json(newCart);
    } catch (error) {
      throw new Error(error);
    }
  });

  const getUserCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
      const cart = await Cart.find({ userId: _id })
      .populate(
        "productId", 
        //"_id title price totalAfterDiscount"
      ).populate("color");
      res.json(cart);
    } catch (error) {
      throw new Error(error);
    }
});

const removeProductFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId } = req.params;
  validateMongoDbId(_id);
  try {
    const deleteProductFromCart = await Cart.deleteOne({ userId: _id, _id: cartItemId })
    res.json(deleteProductFromCart);
  } catch (error) {
    throw new Error(error);
  }
});

// const updatedProductQuantityFromCart = asyncHandler(async (req, res) => {
//   const { _id } = req.user;
//   const { cartItemId, newQuantity } = req.params;
//   validateMongoDbId(_id);
//   try {
//     const cartItem = await Cart.FindOne({ userId: _id, _id: cartItemId })
//     cartItem.quantity = newQuantity
//     cartItem.save()
//     res.json(cartItem);
//   } catch (error) {
//     throw new Error(error);
//   }
// });

const updatedProductQuantityFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId, newQuantity } = req.params;
  validateMongoDbId(_id);

  try {
    const cartItem = await Cart.findOne({ userId: _id, _id: cartItemId });
    
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cartItem.quantity = newQuantity;
    await cartItem.save();

    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: "Error updating cart item quantity", error: error.message });
  }
});


const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findOne({_id});
    const cart = await Cart.findOneAndDelete({ orderby: user._id });
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  const validCoupon = await Coupon.findOne({ name: coupon});
  if(validCoupon == null) {
    throw new Error(" Invalid Coupon ");
  }
  const user = await User.findOne({ _id });
  let { products, cartTotal } = await Cart.findOne({ orderby: user._id })
  .populate(
    "products.product", 
  );
  let totalAfterDiscount = ( cartTotal - (cartTotal * validCoupon.discount) / 100 )
  .toFixed(2);
  await Cart.findOneAndUpdate(
    { orderby:user._id }, 
    { totalAfterDiscount }, 
    { new: true }
  );
  res.json(totalAfterDiscount);
});

const createOrder = asyncHandler(async (req, res) => {
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    if(!COD) throw new Error("Create cash order failed");
    const user = await User.findById(_id);
    let userCart = await Cart.findOne({ orderby: user._id });
    let finalAmount = 0;
    if ( couponApplied && userCart.totalAfterDiscount ) {
      finalAmount = userCart.totalAfterDiscount;
    } else {
      finalAmount = userCart.cartTotal;
    }
    let newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(),
        method: "COD",
        amount: finalAmount,
        status: "Cash on Delivery",
        created: Date.now(),
        currency: "lkr",
      },
      orderby: user._id,
      orderStatus: "Cash on Delivery",
    }).save();
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id : item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count }},
        },
      };
    });
    const updated = await Product.bulkWrite(update, {});
    res.json({ message: "success" });
  } catch (error) {
    throw new Error(error);
  }
});

const getOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const userorders = await Order.findOne({ orderby: _id })
    .populate("products.product")
    .populate("orderby")
    .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const alluserorders = await Order.find()
    .populate("products.product")
    .populate("orderby")
    .exec();
    res.json(alluserorders);
  } catch (error) {
    throw new Error(error);
  }
});

const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userorders = await Order.findOne({ orderby: id })
    .populate("products.product")
    .populate("orderby")
    .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
   const { status } = req.body;
   const { id } = req.params;
   validateMongoDbId(id);
   try {
    const updateOrderStatus = await Order.findByIdAndUpdate(id, 
      { 
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      }, 
      {new: true}
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = { 
    createUser, 
    loginUserCtrl, 
    getallUser, 
    getaUser, 
    updateaUser, 
    deleteaUser,
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
    emptyCart,
    applyCoupon,
    createOrder,
    getOrders,
    getAllOrders,
    updateOrderStatus,
    getOrderByUserId,
    removeProductFromCart,
    updatedProductQuantityFromCart,
};