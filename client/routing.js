if (Meteor.isClient) {

	Router.configure({
		layoutTemplate: 'content',
		//loadingTemplate: 'loading',
		before: function(){
			NProgress.start()
		},
		after: function(){
			NProgress.done()
			//GAnalytics.pageview()
		}
	});
	
	Router.onBeforeAction('loading')
	
	Router.map(function() {
	  	this.route('auctions', {
  			path: '/', waitOn: function(){ 
  				return [Meteor.subscribe("auctions"), Meteor.subscribe("items"), Meteor.subscribe("wtb"), Meteor.subscribe("wts") ]
  			},
  			data: function() { return {auctions: Auctions.find({cost: {$gt:0}},{sort: {updated_at:-1}}).fetch(), wtb: WTB.find({}).fetch(), wts: WTS.find({}).fetch()} }
  		})
	})
	
}