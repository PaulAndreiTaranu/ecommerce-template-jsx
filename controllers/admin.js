const Product = require("../models/product");
const { validationResult } = require("express-validator");
// const fileHelper = require("../utils/file");
const imagesArray = [
    "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
    "https://images.unsplash.com/photo-1579828898622-446b9d65ff73?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
    "https://images.unsplash.com/photo-1522273400909-fd1a8f77637e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=60",
];

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
        .populate("userId", "name")
        .then((products) => {
            res.render("admin/products", {
                pageTitle: "MY SHOP | Admin Products",
                prods: products,
                path: "/admin/products",
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getAddProduct = (req, res, next) => {
    res.render("admin/edit-product", {
        pageTitle: "MY SHOP | Admin Add Product",
        path: "/admin/add-product",
        editing: false,
        hasError: false,
        errorMessage: null,
        product: null,
        validationErrors: [],
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect("/");
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return res.redirect("/");
            }
            res.render("admin/edit-product", {
                pageTitle: "MY SHOP | Edit Product",
                path: "/admin/add-product",
                editing: editMode,
                product: product,
                hasError: true,
                errorMessage: null,
                validationErrors: [],
            });
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = imagesArray[Math.floor(Math.random() * imagesArray.length)];
    const price = req.body.price;
    const description = req.body.description;
    const errors = validationResult(req);

    if (!image) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "MY SHOP | Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description,
            },
            errorMessage: "Attached file is not an image.",
            validationErrors: [],
        });
    }

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "MY SHOP | Add Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    // const imgUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imgUrl: image,
        userId: req.user,
    });
    product
        .save()
        .then((result) => {
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = imagesArray[Math.floor(Math.random() * imagesArray.length)];
    const updatedDescription = req.body.description;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render("admin/edit-product", {
            pageTitle: "MY SHOP | Edit Product",
            path: "/admin/add-product",
            editing: false,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId,
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
        });
    }

    // const imgUrl = image.path;

    Product.findById(prodId)
        .then((product) => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect("/");
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            if (image) {
                // fileHelper.deleteFile(product.imgUrl);
                product.imgUrl = image;
            }
            product.description = updatedDescription;
            return product.save();
        })
        .then((result) => {
            console.log("Updated Product");
            res.redirect("/admin/products");
        })
        .catch((err) => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            if (!product) {
                return next(new Error("Product not found!"));
            }
            // fileHelper.deleteFile(product.imgUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id });
        })
        .then(() => {
            console.log("Product Deleted");
            res.status(200).json({ message: "Success" });
        })
        .catch((err) => {
            res.status(500).json({ message: "Deleteing product failed!" });
        });
};
