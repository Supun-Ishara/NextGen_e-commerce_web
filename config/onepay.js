const crypto = require('crypto');
const axios = require('axios');

class OnePay {
    constructor({ appId, hashSalt, appToken, redirectUrl }) {
        this.appId = appId;
        this.hashSalt = hashSalt;
        this.appToken = appToken;
        this.redirectUrl = redirectUrl;
        this.baseUrl = 'https://merchant-api-live-v2.onepay.lk/api/ipg/gateway/request-transaction/?hash=';
    }

    generateHash(data) {
        const hashObj = data + this.hashSalt;
        return crypto.createHash('sha256')
            .update(hashObj, 'utf-8')
            .digest('hex');
    }

    validateAmount(amount) {
        const numAmount = Number(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            throw new Error('Invalid amount');
        }
        return numAmount;
    }

    // validatePhoneNumber(mobile) {
    //     // Sri Lankan phone number validation
    //     const phoneRegex = /^\+94[0-9]{9}$/;
    //     if (!phoneRegex.test(mobile)) {
    //         throw new Error('Invalid phone number format. Must start with +94');
    //     }
    //     return mobile;
    // }

    async generatePaymentLink(paymentDetails) {
        const amount = this.validateAmount(paymentDetails.amount);
        const mobile = this.validatePhoneNumber(paymentDetails.mobile);

        const data = {
            amount: amount,
            app_id: this.appId,
            reference: paymentDetails.reference || Date.now().toString(),
            customer_first_name: paymentDetails.firstName,
            customer_last_name: paymentDetails.lastName,
            customer_phone_number: mobile,
           // customer_email: paymentDetails.email,
            transaction_redirect_url: this.redirectUrl,
            additional_data: paymentDetails.additionalData
        };

        const dataString = JSON.stringify(data);
        const hash = this.generateHash(dataString);

        try {
            const response = await axios({
                method: 'get',
                url: `${this.baseUrl}${hash}`,
                headers: {
                    'Authorization': this.appToken,
                    'Content-Type': 'application/json'
                },
                data: dataString
            });

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Payment request failed');
        }
    }

    verifyCallback(payload, hash) {
        const calculatedHash = this.generateHash(JSON.stringify(payload));
        return calculatedHash === hash;
    }
}

module.exports = OnePay;