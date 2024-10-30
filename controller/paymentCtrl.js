const OnePay = require('../config/onepay');
const Order = require('../models/orderModel'); // Assuming you have an Order model
const logger = require('../utils/logger'); // Implement a logging utility

const onepay = new OnePay({
    appId: process.env.ONEPAY_APP_ID,
    hashSalt: process.env.ONEPAY_HASH_SALT,
    appToken: process.env.ONEPAY_APP_TOKEN,
    redirectUrl: process.env.ONEPAY_REDIRECT_URL
});

const checkout = async (req, res) => {
    try {
        // Validate required fields
        //const requiredFields = ['amount', 'firstName', 'lastName', 'mobile', 'email']; 
        const requiredFields = ['amount', 'firstName', 'lastName', 'mobile']; //'email'
        for (const field of requiredFields) {
            if (!req.body[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Create payment record in database
        const paymentRecord = await Order.create({
            amount: req.body.amount,
            customerDetails: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                mobile: req.body.mobile,
               // email: req.body.email
            },
            status: 'pending',
            createdAt: new Date()
        });

        const paymentDetails = {
            amount: req.body.amount,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            mobile: req.body.mobile,
           // email: req.body.email,
            reference: paymentRecord._id.toString(),
            additionalData: req.body.additionalData
        };

        // Generate payment link
        const result = await onepay.generatePaymentLink(paymentDetails);

        if (result.data?.gateway?.redirect_url) {
            // Log successful payment initiation
           logger.info(`Payment initiated for order ${paymentRecord._id}`, {
                orderId: paymentRecord._id,
                amount: req.body.amount,
                customerEmail: req.body.email
            });

            res.json({
                success: true,
                redirectUrl: result.data.gateway.redirect_url,
                orderId: paymentRecord._id
            });
        } else {
            throw new Error(result.message || 'Payment link generation failed');
        }
    } catch (error) {
        logger.error('Payment initiation failed', {
            error: error.message,
            stack: error.stack,
            payload: req.body
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const paymentVerification = async (req, res) => {
    try {
        const { status, message, data, hash } = req.body;

        // Verify callback authenticity
        if (!onepay.verifyCallback(data, hash)) {
            throw new Error('Invalid callback signature');
        }

        // Extract order ID from reference
        const orderId = data.reference;
        const order = await Order.findById(orderId);

        if (!order) {
            throw new Error('Order not found');
        }

        // Update order status
        const updateData = {
            status: status === 'SUCCESS' ? 'completed' : 'failed',
            paymentDetails: {
                transactionId: data.transaction_id,
                status,
                message,
                completedAt: new Date()
            }
        };

        await Order.findByIdAndUpdate(orderId, updateData);

        // Log payment completion
        logger.info(`Payment ${status} for order ${orderId}`, {
            orderId,
            status,
            transactionId: data.transaction_id
        });

        // Send appropriate response based on payment status
        if (status === 'SUCCESS') {
            res.json({
                success: true,
                message: 'Payment verified successfully',
                orderId
            });
        } else {
            res.json({
                success: false,
                message: 'Payment failed',
                orderId,
                reason: message
            });
        }
    } catch (error) {
        logger.error('Payment verification failed', {
            error: error.message,
            stack: error.stack,
            payload: req.body
        });

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    checkout,
    paymentVerification,
};



// const Onepay = require("onepay")
// const instance = new Onepay({
//     key_id: "", key_secret: ""
// })

// const checkout = async (req, res) => {
//     const option = {
//         anount: 52000,
//         currency: "LKR"
//     }
//     const order = await instance.orders.create(option)
//     res.json({
//         success: true,
//         order
//     })
// }

// const paymentVerification = async (req, res) => {
//     const {onepayOrderId, onepayPeymentId} =req.body
//     res.json({
//         onepayOrderId, onepayPeymentId
//     })
// }

// module.exports = {
//     checkout,
//     paymentVerification,
// }