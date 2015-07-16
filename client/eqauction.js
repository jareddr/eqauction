if (Meteor.isClient) {
    Template.itemModal.events({
      'click #watchAuction': function(event, template){
        if(!template.data.buying){
          Meteor.call("addWtb", template.data.name)
          IonModal.close()
        }
        else{
          Meteor.call("removeWtb", template.data.name)
          IonModal.close()
        }
      },
      'click #closeModal': function(event, template){
        IonModal.close()
      }
    })

  	Template.auctions.events({
  		'click [rel="watch"]': function () {
  			Meteor.call("addWtb", this.name)
  		},
  		'click [rel="un-watch"]': function () {
  			Meteor.call("removeWtb", this.name)
  		},
      'click [data-action=showActionSheet]': function (event, template) {
          var itemName = this.name
          var buying = false
          if(WTB.findOne({name:this.name})){
            buying = true
          }
          IonActionSheet.show({
            titleText: this.name,
            buttons: [
              { text: buying ? 'Stop looking <i class="icon ion-card"></i>' : 'Looking to buy <i class="icon ion-card"></i>' },
              { text: 'View wiki page <i class="icon ion-share"></i>' },
            ],
            cancelText: 'Cancel',
            cancel: function() {

            },
            buttonClicked: function(index) {
              if (index === 0) {
                console.log("WTB",itemName)
                if(buying)
                  Meteor.call("removeWtb", itemName)
                else
                  Meteor.call("addWtb", itemName)
              }
              if (index === 1) {
                window.open("http://wiki.project1999.com/" + itemName.replace(/'/g, "%27").replace(/ /,"_"))
              }
              return true;
            }
          });
        }
  	});
	Template.auctions.helpers({
    watching: function(){
      return this.wtb ? 'watching' : ""
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
			return moment.duration(moment(TimeSync.serverTime(null, 30000)).diff(moment(date))).humanize()
		},
    costs: function(){
      return this.cost
    },
    costsCompare: function(){
      ret = []
      if(this.median_cost)
        ret.push("eqa:" + this.median_cost)
      if(this.market_price)
        ret.push("wiki:" + this.market_price)
      return ret.join(" | ")
    },
		wikiHref: function(){
			return  "http://wiki.project1999.com/" + this.name.replace(/'/g, "%27").replace(/ /,"_")
		}
	});

  Template.loading.helpers({
    auctionCount: function(){return Auctions.find().count()}
  })


  Meteor.startup(function() {

  })
}
