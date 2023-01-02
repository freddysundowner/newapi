exports.createIntent = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPESECRET);
//   req.body["transfer_data"] = { destination: req.body.destination };
//   req.body["application_fee_amount"] = 1;
  delete req.body["destination"];
  const paymentIntent = await stripe.paymentIntents.create(req.body, {
    stripeAccount: req.body.destination,
  });
  console.log(paymentIntent);
  res
    .status(200)
    .setHeader("Content-Type", "application/json")
    .json(paymentIntent);
};


exports.connect = async (req, res) => {
  const stripe = require("stripe")(process.env.STRIPESECRET);

   const account = await stripe.accounts.create({
      type: "custom",country: 'US',
      capabilities: {
	    card_payments: {requested: true},
	    transfers: {requested: true},
	  },
	   "email": "roomies254@gmail.com",
// 	    'external_account[object]': 'bank_account',
// 	    'external_account[account_holder_type]': 'individual',
// 	    'external_account[country]': 'US',
// 	    'business_type': 'individual',
    })
    const accountLinks = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `https://reggycodas.com/api/stripe/account/reauth?account_id=${account.id}`,
      return_url: `http://deeplinks/pay-out-success?result=${account.id}`,
      type: "account_onboarding",
    });
    console.log(accountLinks);
  res
    .status(200)
    .setHeader("Content-Type", "application/json")
    .json(accountLinks);
};