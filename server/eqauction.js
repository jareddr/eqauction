
if (Meteor.isServer) {

  Meteor.publish("items", function () {
    return Items.find({});
  });
  
  Meteor.publish("auctions", function () {
    return Auctions.find({});
  });


  Meteor.methods({
    parseAunction: function(line){
      var parts = line.replace(/,|\|\/\\/ig, "").trim().split(/\s+/)
      var sell = true;
      var matches = [];
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
          if(lookup = Items.findOne({name: match.trim()})){
              itemMatch = item
              matchPosition = j
          }
        }
        
        if(itemMatch){
          i=matchPosition
          var link = "http://wiki.project1999.com/" + itemMatch.replace(/'/g, "%27").replace(/ /,"_")
          var cost = false;
          if(parts[i+1].match(/\d+/)){
            cost = parts[i+1].match(/\d+\.*\d*/)[0]
            if(parts[i+1].match(/k$/i))
              cost = cost * 1000
          }

          matches.push({name: itemMatch, link: link, cost: cost})
          
        }
      }
      return matches
    }
  });

  Meteor.startup(function () {

    //import item db
    if(!Items.findOne()){
        _.each(Assets.getText("items.txt").split("\n"), function(item){
          Items.insert({name: item})
      })
    }
  });
}
