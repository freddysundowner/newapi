const mongoose = require("mongoose");
const userModel = require("../models/userSchema");
const favoriteModel = require("../models/favorite");
const arrayToObjectIds = require("../shared/arrayToObjectIds");

exports.createFavorite = async (req, res) => {
   let oldfav = await favoriteModel.find({ userId: req.params.userId });
   if(oldfav.length >0 ){
	   let all = await favoriteModel.findByIdAndUpdate(
        oldfav[0]._id,
        {
          $addToSet: {productId: req.body.productId}
        },
        { runValidators: true, new: true})      
        .populate({
			 path: "productId",
		        populate: {
		          path: "ownerId",
		
			        populate: {
			          path: "shopId",
			         
			        },
			        populate: {
			          path: "category",
			         
			        },
		        },
     
      })

    res.status(200).setHeader("Content-Type", "application/json").json(all);        
   }else{
	  let newObj = {
	    productId: arrayToObjectIds(req.body.productId),
	    userId: req.params.userId,
	  };
	  	try {
		  let newFavourite = await favoriteModel.create(newObj);
		  let foundFavourite = await favoriteModel.find({ userId: req.params.userId })      
		       .populate({
			 path: "productId",
		        populate: {
		          path: "ownerId",
		
			        populate: {
			          path: "shopId",
			         
			        },
		        },
     
      })
		  
		  res.status(200).setHeader("Content-Type", "application/json").json(foundRoom )
		} catch (error) {
			res
				.status(422)
				.setHeader("Content-Type", "application/json")
				.json(error.message);
		}
   }
}


exports.getAllFavoriteByUserId = async (req, res) => {
	console.log("getAllFavoriteByUserId");
	try {
		let favorites = await favoriteModel
			.findOne({
				userId: req.params.userId,
			})      
			 .populate({
			    path: "productId",
			        populate: {
			          path: "ownerId",
				        populate: {
				          path: "shopId",
				        }
			        }
     
      })     
			 .populate({
			    path: "productId",
			        populate: {
			          path: "category"
			        }
     
      })			
      .sort({date: -1});

		res.status(200).setHeader("Content-Type", "application/json").json(favorites);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "application/json")
			.json(error.message);
	}
};
exports.updateFavoriteById = async (req, res) => {
	let { productIds, ...setter } = req.body;

	try {
		let favorites = await favoriteModel.findByIdAndUpdate(
			req.params.userId,
			{ $set: req.body },
			{ runValidators: true, new: true }
		)      
        .populate("category").populate({path: "productId", populate: {path:  "shopId"},
			        populate: {
			          path: "category",
			         
			        },});
		res
			.status(200)
			.setHeader("Content-Type", "application/json")
			.json(favorites);
	} catch (error) {
		res
			.status(422)
			.setHeader("Content-Type", "Application/json")
			.json(error.message);
	}
};


exports.deleteFavoriteById = async (req, res) => {
	
	let updatedRoom = await favoriteModel.findByIdAndUpdate(
      req.params.userId,
      {
        $pullAll: { productId: [mongoose.Types.ObjectId(req.body.productId)] },

      },
      { runValidators: true, new: true, upsert: false }
    )       .populate({
			 path: "productId",
		        populate: {
		          path: "ownerId",
		
			        populate: {
			          path: "shopId",
			         
			        },
			        populate: {
			          path: "category",
			         
			        },
		        },
     
      });
 res
      .status(200)
      .json(updatedRoom);
};
