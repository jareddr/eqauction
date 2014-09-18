if (Meteor.isServer){

	Router.map(function () {
	
	  this.route('setAuction', {
	    where: 'server',
	    path: '/auction/add',

	    action: function () {
	      // console.log(this.request)
	      data = this.request.body
	      if(!data.line)
	      	data = this.request.query
	      result = false
	      if(!(data.line))
	      {
	      	this.response.writeHead(400);
	      	this.response.end("Request must supply auction data");
	      	return
	      }
	      Meteor.call("parseAuction", data.line)
	      Log.insert({raw: data.line})
	      this.response.writeHead(200, {'Content-Type': 'text/html'});
	      this.response.end("ok.");
	    }
	  });
	});
}