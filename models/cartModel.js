const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    quantity: {
       type: Number,
       required: true
    },
    price: {
        type: Number,
        required: true
    },
    color: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Color",
    },
      size: {
        type: String,
        required: true
    }

  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Cart", cartSchema);

// const mongoose = require('mongoose'); // Erase if already required

// // Declare the Schema of the Mongo model
// var cartSchema = new mongoose.Schema({
//     products: [
//         {
//             product: {
//               type: mongoose.Schema.Types.ObjectId,
//             ref: "Product",
//             },
//             count: Number,
//             color: String,
//             price: Number,
//         },
//     ],
//     cartTotal: Number,
//     totalAfterDiscount: Number,
//     orderby: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//     },
// }, {
//     timestamps: true,
// });

// //Export the model
// module.exports = mongoose.model('Cart', cartSchema);
