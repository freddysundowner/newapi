const roomsModel = require("../models/roomSchema");
const bidModel = require("../models/bid");
var auctionModel = require("../models/auction");
exports.getAuctions = async (req, res, next) => {
		let auctions = await auctionModel
	      .find()
	      .populate("winner")
	      .populate("winning")
	      .populate("bids")
							      .populate({
								      path: "product",
								      populate: {
								        path: "category",
								      },
								    })
	      .populate({
		      path: "product",
		      populate: {
		        path: "shopId",
		      },
		    })
	    .populate({
	      path: "product",
	      populate: {
	        path: "ownerId",
	        populate: {
	          path: "shopId",
	        },
	      },
	    });
	    res.json(auctions);
    

}

exports.createAuction = async (req, res, next) => {
	
	let auction = await auctionModel.find({"tokshow" : req.body.tokshow, ended : false})
	if(auction.length > 0 ){
		let auctionresponse = await auctionModel.findByIdAndUpdate(
						           auction[0]._id,
						          { $set: req.body },
						          { runValidators: true, new: true }
						        ) .populate("winner")
								  .populate("winning")
							      .populate("bids")
							      .populate({
								      path: "product",
								      populate: {
								        path: "category",
								      },
								    })
							      .populate({
								      path: "product",
								      populate: {
								        path: "shopId",
								      },
								    })
							      .populate({
								      path: "product",
								      populate: {
								        path: "ownerId",
								        populate: {
								          path: "shopId",
								        },
								      },
							    });
        
		 
		await roomsModel.findByIdAndUpdate(
	          req.body.tokshow, 
	          { $set: { activeauction: auction[0]._id } }, 
	          { runValidators: true, new: true } 
	        );
		res.json(auctionresponse);
	}else{
		let auctionresponse = await auctionModel.create(req.body);
		let auction = await auctionModel.findById(auctionresponse._id)
							  .populate("winner")
						      .populate("winning")
						      .populate("bids")
						      .populate({
							      path: "product",
							      populate: {
							        path: "shopId",
							      },
							    })
							      .populate({
								      path: "product",
								      populate: {
								        path: "category",
								      },
								    })
						    .populate({
						      path: "product",
						      populate: {
						        path: "ownerId",
						        populate: {
						          path: "shopId",
						        },
						      },
						    });
	
		
		await roomsModel.findByIdAndUpdate(
	          req.body.tokshow, 
	          { $set: { activeauction: auction._id } }, 
	          { runValidators: true, new: true } 
	        );
	         
	    res.json(auction);
    }

}

exports.updateAuction = async (req, res, next) => {
	let auction = await auctionModel.findByIdAndUpdate(
          req.params.id,
          { $set: req.body },
          { runValidators: true, new: true }
        ).populate("winner")
						      .populate("winning")
						      .populate("bids")
						      .populate({
							      path: "product",
							      populate: {
							        path: "shopId",
							      },
							    })
						      .populate({
							      path: "product",
							      populate: {
							        path: "category",
							      },
							    })
						    .populate({
						      path: "product",
						      populate: {
						        path: "ownerId",
						        populate: {
						          path: "shopId",
						        },
						      },
						    });
        
    res.json(auction);

}



exports.getAuctionRoomId = async (req, res, next) => {
		let auctions = await auctionModel
	      .find({'tokshow':req.params.roomid, ended: false,})
	      .populate("winner")
	      .populate("winning")
	      .populate("bids")
							      .populate({
								      path: "product",
								      populate: {
								        path: "category",
								      },
								    })
	      .populate({
		      path: "product",
		      populate: {
		        path: "shopId",
		      },
		    })
	    .populate({
	      path: "product",
	      populate: {
	        path: "ownerId",
	        populate: {
	          path: "shopId",
	        },
	      },
	    });
	    res.json(auctions);
     

}
 




exports.bid = async (req, res, next) => {
	let bidresponse = await bidModel.create(req.body);
    await auctionModel.findByIdAndUpdate(
      req.params.id, 
      { $addToSet: { bids: bidresponse._id }, }, 
      { runValidators: true, new: true } 
    );
	res.json({"bid": true});

}


exports.deleteAuction = async (req, res, next) => {
	 await auctionModel.findByIdAndDelete(req.params.id).then((auction) => {
	    res.json(auction);
	  });

}