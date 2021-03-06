const express = require("express");
const Product = require("../models/Product");
const { isAuth, isAdmin } = require("../auth.js");
const products = require("../seeders/data.json");

const router = express.Router();
// mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/shopera");

router.get("/seed", (req, res) => {

  Product
    .remove({})
    .then(() => Product.collection.insertMany(products))
    .then(data => {
      console.log(data.result.n + " products inserted!");
      res.json({success: true});
    })
    .catch(err => {
      console.error(err);
      res.json({success: false});
    });
});

router.get("/", async (req, res) => {
    const category = req.query.category ? { category: req.query.category } : {};
    const searchKeyword = req.query.searchKeyword ? {
      name: {
        $regex: req.query.searchKeyword,
        $options: "i"
      }
    } : {};
    const sortOrder = req.query.sortOrder ?
      (req.query.sortOrder === "lowest"? { price: 1 } : { price: -1 })
      :
      { _id: -1 };
    const products = await Product.find({ ...category, ...searchKeyword }).sort(sortOrder);
    res.send(products);
  });
  
  router.get("/:id", async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id });
    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: "Product Not Found." });
    }
  });
  
  router.put("/:id", isAuth, isAdmin, async (req, res) => {
    const isAdmin = req.user.isAdmin;
    const productId = req.params.id;
    console.log("req.body:", req.body);
    const product = await Product.findById(productId);
    if (isAdmin && product) {
      product.name = req.body.name;
      product.price = req.body.price;
      product.image = req.body.image;
      product.brand = req.body.brand;
      product.category = req.body.category;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      const updatedProduct = await product.save();
      if (updatedProduct) {
        return res.status(200).send({ message: "Product Updated", data: updatedProduct });
      }
    }
    return res.status(500).send({ message: " Error in Updating Product." });
  
  });
  
  router.delete("/:id", isAuth, isAdmin, async (req, res) => {
    const deletedProduct = await Product.findById(req.params.id);
    if (deletedProduct) {
      await deletedProduct.remove();
      res.send({ message: "Product Deleted" });
    } else {
      res.send("Error in Deletion.");
    }
  });
  
  
  router.post("/", isAuth, isAdmin, async (req, res) => {
    const product = new Product({
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      brand: req.body.brand,
      category: req.body.category,
      description: req.body.description,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
    });
    const newProduct = await product.save();
    if (newProduct) {
      return res.status(201).send({ message: "New Product Created", data: newProduct });
    }
    return res.status(500).send({ message: " Error in Creating Product." });
  })
  

module.exports = router;