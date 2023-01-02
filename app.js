//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const app = express();

//Initialize mongoose
mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://YusuffKazeem:Ajibola15.@cluster0.zaj3lap.mongodb.net/?retryWrites=true&w=majority');

//Create itemSchema
const itemSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);


//Add ejs engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

//Use public files
app.use(express.static("public"));

// Create Default tasks
const item1 = new Item({
  name: "Welcome to our todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3]; //Add default taks to array

//Create customList Schema
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});
const List = mongoose.model("List", listSchema);

//Server GET route
app.get("/", function(req, res) {
  //Find item in todolistDB
  Item.find((err, foundItems) => {
    //Check if todolist is empty
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => { //Add default items
        if (err) {
          console.log(err);
        } else {
          console.log("defaultItems Successfully added");
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

// server POST ROUTE
app.post("/", function(req, res) {

  const itemName = req.body.newItem; //Get new item name
  const listTitle = req.body.list; //Get listTitle

  //create new item instance
  const newItem = new Item({
    name: itemName
  });
  if (listTitle === "Today") {
    newItem.save(); //Add newItem to todolistDB
    res.redirect("/");
  } else {
    //Search for listTitle instance
    List.findOne({
      name: listTitle
    }, function(err, foundList) {
      if (err) {
        console.log(err);
      } else {
        foundList.items.push(newItem); //Add newItem to listTitle instance
        foundList.save();
        res.redirect("/" + listTitle);
      }
    });
  }


});

//Delete route after checkbox is Checked
app.post("/delete", function(req, res) {
  const obj = JSON.parse(req.body.checkbox);
  const itemId = obj.elementId;
  const listName = obj.listName;

  if (listName === "Today") {
    //Delete item matching to itemId
    Item.findByIdAndDelete({
      _id: itemId
    }, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Item removed Successfully");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: itemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});


//customList GET route
app.get("/:listName", (req, res) => {
  const listName = lodash.capitalize(req.params.listName); //Get customList name

  //Check if list route has been created
  List.findOne({
    name: listName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) { //If listroute does not exist
        //create new list instance
        const newlist = new List({
          name: listName,
          items: defaultItems
        });
        newlist.save(); //save newList
        res.redirect("/" + listName); //res.render newList
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });

});
app.get("/about", function(req, res) {
  res.render("about");
});

//Tune server to port 3000
app.listen(process.env.PORT||3000, function() {
  console.log("Server started on port 3000");
});
