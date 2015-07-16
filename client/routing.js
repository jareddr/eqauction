if (Meteor.isClient) {

	Router.configure({
		layoutTemplate: 'content'
	});

	Router.map(function() {
	  	this.route('auctions', {
  			path: '/', waitOn: function(){
  				return [Meteor.subscribe("auctions", 2), Meteor.subscribe("wtb"), Meteor.subscribe("wts") ]
  			},
  			data: function() {
  				return {
  					auctions: Auctions.find({cost: {$gt:0}},{sort: {updated_at:-1}}).fetch(),
  					wtb: WTB.find({}).fetch(),
  					wts: WTS.find({}).fetch()
  				}
  			},
				action: function(){
					if(this.ready()) {
						this.render()
					}else{
						this.render('loading');
					}
				}
  		})
	})

}
