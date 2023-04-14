//jshint esversion:6

const express = require("express");
const mongoose = require("mongoose"); // 1
const bodyParser = require("body-parser");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect("mongodb://localhost:27017/todolistDB"); // 2

const itemsSchema = {
	// 3 create schema
	name: { type: String, unique: true },
};

const Item = mongoose.model("Item", itemsSchema); // 4 create new mongoose model based on the itemsSchema

const Item1 = new Item({
	// 5 add 3 documents to Item model
	name: "Welcome to your todolist!",
});

const Item2 = new Item({
	name: "Hit the + button to add new item.",
});

const Item3 = new Item({
	name: "<-- Hit this to delete an item.",
});

const defaultItems = [Item1, Item2, Item3]; // 6

const listSchema = {
	// 13 schema for custom list
	name: String,
	items: [itemsSchema], // take array doc of itemSchema type as param
};

const List = mongoose.model("List", listSchema); // 14 mongoose model for list

// Item.insertMany(defaultItems) // 7
// 	.then(() => {
// 		console.log("Successfully saved records to DB.");
// 	})
// 	.catch((e) => console.log(e.message));

app.get("/", function (req, res) {
	Item.find().then((item) => {
		if (item.length == 0) {
			Item.insertMany(defaultItems) // 9 (if not another 9)
				.then(() => {
					console.log("Successfully saved records to DB.");
				})
				.catch((e) => console.log(e.message));

			res.redirect("/"); //when there is no items in db then add after adding we dont display anything so this line will redirect the webpage to root route which wil execute the code from starting and then now our db is not empty so else statement will execute
		} else {
			res.render("list", {
				listTitle: "Today",
				newListItems: item, // 8
			});
		}
	});
});

app.post("/", function (req, res) {
	const itemName = req.body.newItem; // 10
	const listName = req.body.list;

	const item = new Item({
		name: itemName,
	});

	if (listName === "Today") {
		item.save();
		res.redirect("/"); // redirect after adding new item to the list
	} else {
		List.findOne({ name: listName }).then((list) => {
			// 13 adding items to custom lists
			list.items.push(item);
			list.save();

			res.redirect("/" + listName);
		});
	}
});

app.post("/delete", (req, res) => {
	// 11
	const checkedItemID = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today") {
		Item.findByIdAndDelete({ _id: checkedItemID }).then(() => {
			res.redirect("/");
		});
	} else {
		List.findOneAndUpdate(
			{ name: listName },
			{ $pull: { items: { _id: checkedItemID } } }
		).then(() => {
			res.redirect("/" + listName);
		});
	}
});

app.get("/:customListName", (req, res) => {
	// 12 custom list creation

	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName })
		.then((list) => {
			if (list != null) {
				// list exist ... show list
				// console.log("list exist");
				res.render("list", { listTitle: list.name, newListItems: list.items });
			} else {
				// list doesn't exist ... create list
				// console.log("list not exist");
				const list = new List({
					name: customListName,
					items: defaultItems,
				});

				list.save();

				res.redirect("/" + customListName);
			}
		})
		.catch((e) => {
			console.log(e.message);
		});
});

app.listen(3000, function () {
	console.log("Server started on port 3000");
});
