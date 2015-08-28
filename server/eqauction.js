
if (Meteor.isServer) {



  // var xmpp = Meteor.npmRequire('node-xmpp')

   sendAlert = function(text){
        Email.send({
          to: "jareddr@gmail.com",
          from: "eqauction@gmail.com",
          subject: text,
          text: text
        });
  //     var client = new xmpp.Client({
  //     jid: Meteor.settings.chat_login,
  //     password: Meteor.settings.chat_password,
  //     host        : 'talk.google.com',
  //     port        : 5222
  //     })

  //     client.on('online', function() {
  //         console.log('online')
  //         client.send(new xmpp.Element('presence', { type: 'available' }).
  //             c('show').t('chat')
  //            );

  //         client.send(new xmpp.Element('message',
  //           { to: "jaredr@betabrand.com", // to
  //               type: 'chat'}).
  //               c('body').
  //               t(text));
  //     })

  //     client.on('error', function(error) {
  //         console.log(error)
  //       })

  //     client.on('stanza', function(stanza) {
  //         //console.log(stanza)
  //     })
  }

  getMedian = function(prices){
    prices.sort( function(a,b) {return a - b;} );
    var median = false
    var half = Math.floor(prices.length/2);

    if(prices.length % 2)
        median =  prices[half];
    else
        median = (prices[half-1] + prices[half]) / 2

    return median
  }

  Meteor.publish("items", function () {
    return Items.find({});
  });

  Meteor.publish("auctions", function (options) {
    console.log(options)

    var searchObject = {},
        limitObject = {}
    if(options.hoursBack){
      searchObject.updated_at = {$gt: new Date(moment().hours(moment().hours()-options.hoursBack))}
    }

    if(options.search){
      var matchRe = new RegExp(options.search.trim(), "i")
      searchObject.name = matchRe
    }

    if(options.limit){
      limitObject.limit = parseInt(options.limit)
    }

    return Auctions.find(searchObject, limitObject);
  });

  Meteor.publish("wts", function(){
    return WTS.find({})
  })

  Meteor.publish("wtb", function(){
    return WTB.find({})
  })

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
          var cost = false;
          if(parts[i+1].match(/\d+/)){
            cost = parts[i+1].match(/\d+\.*\d*/)[0]
            if(parts[i+1].match(/k/i) || cost.match(/\d\.\d/))
              cost = parseFloat(cost) * 1000
          }
          cost = cost ? parseInt(cost) : false

          Meteor.call('getWikiAverage', itemId)
          var item = Items.findOne({_id: itemId})
          var existing = Auctions.findOne({player:player, date:date, name: itemMatch})
          var wtb = WTB.findOne({name:item.name}) ? true : false
          if(existing && existing.cost > cost){
              //console.log("Updating " + existing.player+":"+existing.name + " to " + cost)
              Auctions.update({_id:existing._id}, {$set: {cost:cost, updated_at: new Date(), image: item.image, wtb: wtb}})
          }
          else if(existing){
              updatedTimestamp = new Date(existing.updated_at).getTime()
              //only move repeat auctions to the top of the list once every 5 mins
              if(updatedTimestamp + 1000 * 60 * 5 < Date.now())
                Auctions.update({_id:existing._id}, {$set: {updated_at: new Date(), image: item.image, wtb: wtb}})
              else {
                console.log("Not updating " + existing.name + " from " +  existing.player + " because it was last updated less than 5 min ago.")
              }
          }
          else if (cost){
            var prevAuctions = Auctions.find({name:itemMatch, sell:true, cost: {$gt: 0}}).fetch()
            var localMedian = parseInt(getMedian(_.pluck(prevAuctions, "cost")))
            newAuction = Auctions.insert({player: player, sell:sell, median_cost: parseInt(localMedian), item_id: item._id, market_price: item.market_price, image: item.image, date: date, name: itemMatch, original_cost: cost, cost: cost, created_at: new Date(), updated_at: new Date(), wtb: wtb})
            if(sell && cost > 0){
              Meteor.call("checkAlert", newAuction)
            }
          }
        }
      }
    },
    checkAlert: function(newAuction){
      item = Auctions.findOne({_id: newAuction})
      //do some cleanup here
      if(item.cost < 99 && (item.market_price > 1000 || item.median_cost > 1000)){
        item.cost = item.cost*1000
        Auctions.update({_id:newAuction}, {$set: {cost: item.cost}})
      }

      buying = WTB.findOne({name:item.name})
      basePrice = _.max([item.market_price, parseInt(item.median_cost)])
      if(buying && item.cost <= 0.75*basePrice){
        sendAlert(item.name + " for sale " + item.cost + "pp from " + item.player + ".")
      }
    },

    addWtb: function(item){
      WTB.upsert({name: item}, {name:item})
      Auctions.update({name:item}, {$set: {wtb:true}}, {multi:true})

    },
    removeWtb: function(item){
      WTB.remove({name: item})
      Auctions.update({name:item}, {$set: {wtb:false}}, {multi:true})
    },
    addWts: function(item){
      WTS.upsert({name:item}, {name:item})
    },
    removeWts: function(){
      WTS.remove({name:item})
    },
    getWikiAverage: function(item_id){
      var item = Items.findOne({_id: item_id})

      if(!item.image){
        var link = "http://wiki.project1999.com/" + item.name.replace(/'/g, "%27").replace(/ /,"_")
        HTTP.get(link, {}, function(err,resp){
            if(resp && resp.content){
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

              var img = resp.content.match(/\/images\/Item_\d+\.png/)

              median = getMedian(prices)
              updateSet = {market_price: median}

              if(img.length){
                updateSet.image = img[0]
              }
              console.log("Updating items and auctions entries", updateSet)
              Items.update({_id: item_id}, {$set: updateSet })
              Auctions.update({item_id: item_id}, {$set: updateSet}, {multi:true})
            }
            else{
              console.log("[ERROR] Could not look up " + item.name + " on p1999 wiki")
            }
        });
      }
    }
  });

  Meteor.startup(function () {
  console.log(process.env.MAIL_URL)
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
