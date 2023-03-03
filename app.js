//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require('lodash');

mongoose.set('strictQuery', true)

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB")

const itemsSchema={
  name:String
}

const listsSchema={
  name:String,
  items:[itemsSchema]
}

const List= mongoose.model("List", listsSchema)

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name:"Laundry"
})

const item2 = new Item({
  name:"Do the Dishes"
})

const item3 = new Item({
  name:"Groceries"
}) 

const defaultItems=[item1,item2,item3]

 
app.get("/", function(req, res) {

  Item.find({}, function(err,foundItems){
    if(foundItems.length===0){
      Item.insertMany(defaultItems, function(err){
        if(err){console.log(err)}else{console.log("Default items successfully inserted to the DB!")}
      })
      res.redirect("/")
    }else {
      res.render("list", {listTitle: "Today", newListItems: foundItems})}
            
  })
  
});


app.post("/", function(req, res){
  const prListName = req.body.list
  const newItem = new Item ({
    name: req.body.newItem
  })
  if(prListName==="Today"){
    newItem.save()
    res.redirect("/")
  }else{
    List.findOneAndUpdate({name:prListName},{$push:{items:newItem}}, function(err,prFoundList){
      if(err){console.log(err)
      }else{
        prFoundList.save()
        res.redirect("/"+prListName)}
    })
  }
  })

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkedItem
  const listName=req.body.listName
  if(listName==="Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){console.log(err)}else{
        res.redirect("/")
      }
    })
    
  }else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName)
      }

    })
  } 
})

app.get("/:paramName", function(req,res){
  const customListName=_.startCase(req.params.paramName)
  List.findOne({name:customListName},function(err, foundList){
    if(err){console.log(err)}else{
      if(foundList){
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items})
      }else{
        const newList = new List({
          name:customListName,
          items:defaultItems
        })
        newList.save()
        res.render("list", {listTitle:newList.name, newListItems:newList.items})
      }
    }
  }) 
})



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
