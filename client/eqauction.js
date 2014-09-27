if (Meteor.isClient) {
  
  	Template.auctions.events({
  		'click [rel="watch"]': function () {
  			Meteor.call("addWtb", this.name)
  		},
  		'click [rel="un-watch"]': function () {
  			Meteor.call("removeWtb", this.name)
  		}  		
  	});
	Template.auctions.helpers({
		wtb: function () {
			if(WTB.findOne({name:this.name})){
				return true
			}

			return false
		},
		dealWatch: function(){
			var baseCompare = _.max([parseInt(this.median_cost), parseInt(this.market_price)])
			console.log(baseCompare)
			console.log(this)
			if(this.cost <= baseCompare * 0.50)
				return "crazydeal"
			else if (this.cost < baseCompare * 0.75)
				return "deal"

			return ""
		}
	});

  Meteor.startup(function() {
   
  })
}
