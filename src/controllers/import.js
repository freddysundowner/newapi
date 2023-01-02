const productSchema = require("../models/productSchema");
const shopSchema = require("../models/shopSchema");
const axios = require("axios");
var striptags = require("striptags");
async function fetchWcProducts(exclude = [], include = [], shop) {
	
	const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
// import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api"; // Supports ESM

const WooCommerce = new WooCommerceRestApi({
  url: 'https://sunpay.co.ke/wp/',
  consumerKey: shop.wcConsumerKey,
  consumerSecret: shop.wcSecretKey,
  version: 'wc/v3',
  queryStringAuth: true
});
var products = await WooCommerce.get("products")
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.log(error.response.data);
  });
console.log(products);

  var wooData = await axios({
    method: "get",
    url: `${shop.wcUrl}products/?consumer_key=${shop.wcConsumerKey}&consumer_secret=${shop.wcSecretKey}`,
    data: {
      exclude,
      include,
      per_page: "10",
    },
  });

  return wooData;
}
async function fetchShopifyProducts(shop, type) {
	var url = '';
	if(type == "update"){
		url = shop.shopifyLastDate !=null ? `${shop.shopifyUrl}products.json?created_at_max=${shop.shopifyLastDate}` : `${shop.shopifyUrl}products.json`;
	}else{
		url = shop.shopifyLastDate !=null ? `${shop.shopifyUrl}products.json?created_at_min=${shop.shopifyLastDate}` : `${shop.shopifyUrl}products.json`;
	}
  var wooData = await axios({
    method: "get",
    url: url,
    headers: {
      "X-Shopify-Access-Token": shop.shopifyAccessToken,
    },
  });

	console.log(wooData.data);
  return wooData.data;
}

async function importShopifyProductsToDb(products, type, userId, shopData) {
	try {
		  products.products.map(async (result) => {
		    var images = [];
		    var categories = [];
		
		    result.images.map((image) => {
		      images.push(image.src);
		    });
		/*
		    result.categories.map((category) => {
		      categories.push(category.name);
		    });
		*/
		
		    var product = {
		      name: result.title,
		      price: result.variants[0].price,
		      discountedPrice: result.variants[0].compare_at_price,
		      images: images,
		      variations: result.options[0].values,
		      categories: [],
		      description: striptags(result.body_html),
		      type: "SP",
		      spId: result.id,
		      quantity: result.variants[0].inventory_quantity,
		      shopId: shopData._id,
		      ownerId: shopData.userId,
		    };
		    if (type == "update") {
			console.log(product.spId);
		      await productSchema.findOneAndUpdate({ spId: product.spId }, product);
		    } else {
		      await new productSchema(product).save();
		    }
		  });
		  var shopifyIds = [];
		  var lastProduct = products.products.reduce(function (result, currentObject) {
		  	shopifyIds.push(currentObject.id);
		    return [currentObject];
		  }, []);
		  
		//   console.log("lastProduct",lastProduct);
		  if (shopifyIds.length > 0) {
		    await shopSchema.findOneAndUpdate(
		      { _id: shopData._id },
		      { shopifyLastDate: lastProduct[0].created_at }
		    );
		  }
		  return shopifyIds ?? [];
	} catch (error) {
		console.log(error);
	    return [];
	  }
}
async function importProductsToDb(products, type, userId, shopData) {
  products.map(async (result) => {
    var images = [];
    var categories = [];

    result.images.map((image) => {
      images.push(image.src);
    });
    result.categories.map((category) => {
      categories.push(category.name);
    });

    var product = {
      name: result.name,
      price: result.regular_price,
      discountedPrice: result.sale_price,
      images: images,
      variations: result.attributes[0].options,
      categories: categories,
      description: striptags(result.description),
      type: "WC",
      wcid: result.id,
      quantity: result.manage_stock == false ? 0 : result.stock_quantity,
      shopId: shopData._id,
      ownerId: shopData.userId,
    };
    if (type == "update") {
      await productSchema.findOneAndUpdate({ wcid: result.id }, product);
    } else {
      await new productSchema(product).save();
    }
  });
  var wcIds = [];
  var Ids = products.reduce(function (result, currentObject) {
  	wcIds.push(currentObject.id);
    return [currentObject.id];
  }, []);
  if (wcIds.length > 0) {
    await shopSchema.findOneAndUpdate(
      { userId: userId },
      {
        $addToSet: { wcIDs: wcIds },
      }
    );
  }
  return wcIds ?? [];
}
exports.importShopifyProducts = async (req, res) => {
  try {
    if (req.body.userId) {
      var shopData = await shopSchema.findOne({ userId: req.body.userId });
      if (shopData) {
/*
        if (shopData.shopifyLastDate != ""  && req.body.type == "check") {
          res.json({
            status: false,
            message: `you already have imported products, do you want to update them or import new once?`,
            alert: true,
          });
        } else 
*/
        
        if (req.body.type == "update") {
          var products = await fetchShopifyProducts(
            shopData,
            "update"
          );
          var shopifyIDs = await importShopifyProductsToDb(
            products,
            req.body.type,
            req.body.userId,
            shopData
          );
          res.json({
            status: true,
            message: `Shopify ${shopifyIDs.length} products updated successfully`,
            count: shopifyIDs.length,
            alert: false,
          });
        } else if (req.body.type == "import" || req.body.type == "check") {
          var products = await fetchShopifyProducts(
            shopData,
            "import"
          );

          var shopifyIDs = await importShopifyProductsToDb(
            products,
            req.body.type,
            req.body.userId,
            shopData
          );
          res.json({
            status: true,
            message: `Shopify ${shopifyIDs.length} products imported successfully`,
            count: shopifyIDs.length,
            alert: false,
          });
        }
      }
    } else {
      res.json({ status: false, message: "user id is required" });
    }
  } catch (error) {
    res.json({ status: false, message: error.message });
  }
};

exports.importWcProducts = async (req, res) => {
  try {
    if (req.body.userId) {
      var shopData = await shopSchema.findOne({ userId: req.body.userId });

      if (shopData.length != 0) {
/*
        if (shopData.wcIDs.length > 0 && req.body.type == "check") {
          res.json({
            status: false,
            message: `you had already imported ${shopData.wcIDs.length} products, do you want to update them or import new once?`,
            alert: true,
          });
        } else 
*/
        
        if (req.body.type == "update") {
          var products = await fetchWcProducts([], shopData.wcIDs, shopData);
          var wcIds = await importProductsToDb(
            products.data,
            req.body.type,
            req.body.userId,
            shopData
          );
          res.json({
            status: true,
            message: `Woocomerce ${wcIds.length} products updated successfully`,
            count: wcIds.length,
            alert: false,
          });
        } else if (req.body.type == "import" || req.body.type == "check") {
          var products = await fetchWcProducts(shopData.wcIDs, [], shopData);
          var wcIds = await importProductsToDb(
            products.data,
            req.body.type,
            req.body.userId,
            shopData
          );
          res.json({
            status: true,
            message: `Woocomerce ${wcIds.length} products imported successfully`,
            count: wcIds.length,
            alert: false,
          });
        }
      }
    } else {
	    console.log({ status: false, message: error.message });
      res.json({ status: false, message: "user id is required" });
    }
  } catch (error) {
	    console.log({ status: false, message: error.message });
    res.json({ status: false, message: error.message });
  }
};
