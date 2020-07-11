// 2flMaRq183mq7OXb
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const https = require("https");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csurf = require("csurf");
const flash = require("connect-flash");
const helmet = require("helmet");
const compression = require("compression");
// const morgan = require("morgan");

// ROUTES & CONTROLLERS
const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const errorController = require("./controllers/error");
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });

// DATABASES & MODELS
const User = require("./models/user");
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.1l8tr.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

// APP
const app = express();
const store = new MongoDbStore({
    uri: MONGODB_URI,
    collection: "sessions",
});
const csurfProtection = csurf();
// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "images");
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + "-" + file.originalname);
    },
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.set("view engine", "ejs");
app.set("views", "views");
app.use(helmet());
app.use(compression());
// app.use(morgan("combined", { stream: accessLogStream }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single("image"));
app.use(session({ secret: "mySecret", resave: false, saveUninitialized: false, store: store }));
app.use(csurfProtection);
app.use(flash());
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csurfToken = req.csrfToken();
    next();
});
app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then((user) => {
            if (!user) {
                return next();
            }
            req.user = user;
            next();
        })
        .catch((err) => {
            next(new Error(err));
        });
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.get("/500", errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    res.status(500).render("500", {
        pageTitle: "Error!",
        path: "/500",
        isAuthenticated: req.session.isLoggedIn,
    });
});

mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((result) => {
        // https.createServer({ key: privateKey, cert: certificate }, app).listen(process.env.PORT || 3000);
        app.listen(process.env.PORT || 3000);
    })
    .catch((err) => {
        console.log(err);
    });
