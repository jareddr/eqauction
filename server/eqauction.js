
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
    parseAuction: function(line, test){
      var parts = line.replace(/,/ig, "").replace(/'$/, "").replace(/[\[\]\|\/\\-]/ig, " ").replace(/ '/," ").replace(/([^\d^\.])(\d)/g, "$1 $2").replace(/\s+/, " ").trim().split(/\s+/)
      console.log(line.replace(/,/ig, "").replace(/\|\/\\-/ig, " ").replace(/ '/," ").replace(/([^\d^\.])(\d)/g, "$1 $2").replace(/\s+/, " ").trim())
      var sell = true;
      var matches = [];
      var player = line.match(/\] ([^\s]+) auctions/) ? line.match(/\] ([^\s]+) auctions/)[1] : null
      var now = new Date()
      var date = now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate()
      for(var i=0; i<parts.length; i++){
        var match="";
        var lookup = false;
        var itemMatch = false;
        var itemId = false;
        var matchPosition = 0;
        
        if(parts[i].match(/^(wtb|buy|buying)$/i))
          sell = false
        else if(parts[i].match(/^(wts|sell|selling)$/i))
          sell = true

        for(var j=i; j<parts.length && sell; j++){ 
          match += " " + parts[j];
          var matchRe = new RegExp("^" + match.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + "$", "i")
          //console.log(matchRe)
          lookup = Items.findOne({name: matchRe})
          if(lookup){
              //console.log(lookup)
              itemMatch = lookup.name
              itemId = lookup._id
              matchPosition = j
          }
        }
        
        if(itemMatch){
          i=matchPosition
          var link = "http://wiki.project1999.com/" + itemMatch.replace(/'/g, "%27").replace(/ /,"_")
          var cost = false;
          if(parts[i+1].match(/\d+/)){
            cost = parts[i+1].match(/\d+\.*\d*/)[0]
            if(parts[i+1].match(/k$/i) || cost.match(/\./))
              cost = parseFloat(cost) * 1000
          }
          cost = cost ? parseInt(cost) : false

          Meteor.call('getWikiAverage', itemId)
          var item = Items.findOne({_id: itemId})
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
            Auctions.insert({player: player, sell:sell, item_id: item._id, market_price: item.market_price, date: date, name: itemMatch, original_cost: cost, cost: cost, created_at: new Date(), updated_at: new Date()})  
          }
        }
      }
    },
    getWikiAverage: function(item_id){
      var item = Items.findOne({_id: item_id})

      if(!item.market_price){
        var link = "http://wiki.project1999.com/" + item.name.replace(/'/g, "%27").replace(/ /,"_")
        HTTP.get(link, {}, function(err,resp){
            console.log(item.name)
            console.log("\n====================\n")
            var matches = resp.content.match(/<td>\s*(\d\d\d\d-\d\d-\d\d)\s*<\/td>\s*<td>\s*([^<]+)<\/td>\s*<td>\s*(\d+)\s*<\/td>/g)
            var prices = [],
              median = 0
            _.each(matches, function(v,i){
              //console.log(i + ' - ' + v)
              var cost = v.replace(/^<td>/,"").replace(/<\/td>$/,"").split(/<\/td>\s*<td>/)[2]
              prices.push(parseInt(cost.trim()))
            })

            //grab median price and store it
               prices.sort( function(a,b) {return a - b;} );
           
              var half = Math.floor(prices.length/2);
           
              if(prices.length % 2)
                  median =  prices[half];
              else
                  median = (prices[half-1] + prices[half]) / 2
                //console.log(median)
                Items.update({_id: item_id}, 
                  {$set: {market_price: median}})
                Auctions.update({item_id: item_id}, {$set: {market_price: median}}, {multi:true})
        });
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
    var i =0;
    Auctions.find({item_id: null}).forEach(function(l){
      item = Items.findOne({name: l.name})
      if(item)
      {
        Auctions.update({_id: l._id}, {$set: {item_id: item._id}})
      }
    })

    //Meteor.call("parseAuction",  "[Wed Sep 17 23:46:55 2014] Foggon auctions, 'WTS - Black Sapphire 3k obo Spell: Talisman of the Brute 2k, Mucilaginous Girdle 1.2k, Rod of Oblations 500p, Acid Etched War Sword 4k'",true)

    

  });
}
