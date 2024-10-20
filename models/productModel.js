const mongoose = require('mongoose'); // Erase if already required

const ALLOWED_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

// Declare the Schema of the Mongo model
var productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true,
    },
    slug:{
        type:String,
        required:true,
        unique:true,
        lowercase: true,
    },
    description:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    category: {
        type:String,
        required: true,
    },
    // brand: {
    //    type:String,
    //    required: true, 
    //  //  select: false,
    // },
    quantity: {
        type:Number,
        required: true,
     //   select: false,
    },
    sold: {
       type:Number,
       default: 0,
    //   select: false,
    },
    images: [
        {
            public_id: String,
            url: String,
        }
    ],
    color: [{type: mongoose.Schema.Types.ObjectId, ref: "Color"}],
    tags: String,
    size: {
        type: [String],
        enum: ALLOWED_SIZES,
        required: true,
        validate: {
            validator: function(sizes) {
                return sizes && sizes.length > 0;
            },
            message: 'At least one size must be selected'
        }
    },
    sku:{
        type:String,
        required:true,
        unique:true,
        uppercase: true,
    },
    ratings: [{
        star:Number,
        comment: String,
        postedby:{ type: mongoose.Schema.Types.ObjectId, ref: "User"},
    },
  ],
    totalrating: {
        type: String,
        default: 0,
},
}, 
{timestamps:true}
);

//Export the model

//mongoose.model('Product', productSchema);
module.exports = mongoose.model('Product', productSchema);

//module.exports = mongoose.model('Product');