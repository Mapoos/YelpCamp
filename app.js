var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    Campground = require('./models/campground'),
    seedDB = require('./seeds'),
    Comment = require('./models/comment'),
    User = require('./models/user')

// seedDB()

// PASSPORT CONFIGURATION
app.use(require('express-session')({
    secret: 'Wowowowowow',
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

// Attention: this middleware must be put behind the above middlewares
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    next()
})

mongoose.connect('mongodb://localhost/yelp_camp', { useNewUrlParser: true, useUnifiedTopology: true })
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
    res.render('landing')
})

// INDEX - show all campgrounds
app.get('/campgrounds', function (req, res) {
    Campground.find({}, function (err, allcampgrounds) {
        if (err) {
            console.log(err)
        } else {
            res.render('campgrounds/index', { campgrounds: allcampgrounds })
        }
    })
})

// NEW - show form to create new campground
app.get('/campgrounds/new', isLoggedIn, function (req, res) {
    res.render('campgrounds/new')
})

// CREATE - add new campgrounds
app.post('/campgrounds', isLoggedIn, function (req, res) {
    Campground.create(req.body.campground, function (err, newlyCreated) {
        if (err) {
            console.log(err)
        } else {
            res.redirect('/campgrounds')
        }
    })
})

// SHOW - shows more info about one campground
app.get('/campgrounds/:id', function (req, res) {
    // find the campground with provided ID
    Campground.findById(req.params.id).populate('comments').exec(function (err, foundCampground) {
        if (err) {
            console.log(err)
        } else {
            // render show template with that campground
            res.render('campgrounds/show', { campground: foundCampground })
        }
    })

})

// ========================================
// COMMENTS ROUTES
// ========================================

app.get('/campgrounds/:id/comments/new', isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err)
        } else {
            res.render('comments/new', { campground: campground })
        }
    })
})

app.post('/campgrounds/:id/comments', isLoggedIn, function (req, res) {
    Campground.findById(req.params.id, function (err, campground) {
        if (err) {
            console.log(err)
            res.redirect('/camgrounds')
        } else {
            Comment.create(req.body.comment, function (err, comment) {
                if (err) {
                    console.log(err)
                } else {
                    campground.comments.push(comment)
                    campground.save()
                    res.redirect('/campgrounds/' + campground._id)
                }
            })

        }
    })
})

// =================
// AUTH ROUTES
// =================

// show register form
app.get('/register', function (req, res) {
    res.render('register')
})

// handle sign up logic
app.post('/register', function (req, res) {
    var newUser = new User({ username: req.body.username })
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err)
            return res.render('register')
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect('/campgrounds')
        })
    })
})

// show login form
app.get('/login', function (req, res) {
    res.render('login')
})

// handle login logic
app.post('/login', passport.authenticate('local', { successRedirect: '/campgrounds', failureRedirect: '/login' }), function (req, res) { })

// logout route
app.get('/logout', function (req, res) {
    req.logout()
    res.redirect('/campgrounds')
})



app.listen(2333, function () {
    console.log("Server is now listening!")
})

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}