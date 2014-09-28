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
			if(this.cost <= baseCompare * 0.50)
				return "crazydeal"
			else if (this.cost < baseCompare * 0.75)
				return "deal"

			return ""
		},
		prettyTime: function(date){
			return moment.duration(moment().diff(moment(date))).humanize()
		},
		wikiHref: function(){
			return  "http://wiki.project1999.com/" + this.name.replace(/'/g, "%27").replace(/ /,"_")
		}
	});

  Meteor.startup(function() {
   
  })
}
