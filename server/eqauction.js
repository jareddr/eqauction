
if (Meteor.isServer) {

  Meteor.publish("items", function () {
    return Items.find({});
  });
  
  Meteor.publish("auctions", function () {
    return Auctions.find({});
  });

//if ever want to price check on project1999 wiki
//$('body').html().match(/<td>\s*(\d\d\d\d-\d\d-\d\d)\s*<\/td>\s*<td>\s*([^<]+)<\/td>\s*<td>\s*(\d+)\s*<\/td>/g)[1].replace(/^<td>/,"").replace(/<\/td>$/,"").split(/<\/td>\s*<td>/)


  Meteor.methods({
    parseAuction: function(line){
      var parts = line.replace(/,|\|\/\\/ig, "").trim().split(/\s+/)
      var sell = true;
      var matches = [];
      var player = line.match(/\] ([^\s]+) auctions/) ? line.match(/\] ([^\s]+) auctions/)[1] : null
      var now = new Date()
      var date = now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate()
      for(var i=0; i<parts.length; i++){
        var match="";
        var lookup = false;
        var itemMatch = false;
        var matchPosition = 0;
        
        if(parts[i].match(/^(wtb|buy|buying)$/i))
          sell = false
        else if(parts[i].match(/^(wts|sell|selling)$/i))
          sell = true

        for(var j=i; j<parts.length && sell; j++){ 
          match += " " + parts[j];
          if(lookup = Items.findOne({name: /match.trim()/i})){
              itemMatch = match.trim()
              matchPosition = j
          }
        }
        
        if(itemMatch){
          i=matchPosition
          var link = "http://wiki.project1999.com/" + itemMatch.replace(/'/g, "%27").replace(/ /,"_")
          var cost = false;
          if(parts[i+1].match(/\d+/)){
            cost = parseInt(parts[i+1].match(/\d+\.*\d*/)[0])
            if(parts[i+1].match(/k$/i))
              cost = cost * 1000
          }

          var existing = Auctions.findOne({player:player, date:date, name: itemMatch})
          if(existing && existing.cost > cost){
              //console.log("Updating " + existing.player+":"+existing.name + " to " + cost)
              Auctions.update({_id:existing._id}, {$set: {cost:cost, updated_at: new Date()}})
          }
          else if(existing){
              Auctions.update({_id:existing._id}, {$set: {updated_at: new Date()}})
          }
          else{
            //console.log("Inserting:")
            //console.log({player: player, date: date, name: itemMatch, cost: cost, created_at: new Date(), updated_at: new Date()})
            Auctions.insert({player: player, sell:sell, date: date, name: itemMatch, original_cost: cost, cost: cost, created_at: new Date(), updated_at: new Date()})  
          }
        }
      }
    }
  });

  Meteor.startup(function () {

    //import item db
    if(!Items.findOne()){
        _.each(Assets.getText("items.txt").split("\n"), function(item){
          Items.insert({name: item})
      })
    }

    Auctions.find({raw: {$exists: true}}).forEach(function(l){
      Auctions.remove({_id: l._id})
      Meteor.call("parseAuction", l.raw)
    })

    

  });
}
