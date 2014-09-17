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
  				return [Meteor.subscribe("auctions"), Meteor.subscribe("items")]
  			},
  			data: function() { return {auctions: Auctions.find().fetch()} }
  		})
	})
	
}