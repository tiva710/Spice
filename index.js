const emoji = require('emoji-open-book');
const express = require("express");
const mysql = require('mysql');
const app = express();
const pool = dbConnection();
const request = require('request');
const session = require('express-session');
const alert = require('alert');
const toastr = require('toastr');

app.set('trust proxy', 1)
app.use(session({
  secret: 'red velvet',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/home', (req, res) => {
  res.render('home');
});

app.get('/cookbook', isAuthenticated, async (req, res) => {
  let hasRecipes = true;

  let sql = 'SELECT * FROM user_recipe where user = ?';
  let rows = await executeSQL(sql, [req.session.userId]);
  let sql2 = 'SELECT * FROM user_cocktail where user = ?';
  let rows2 = await executeSQL(sql2, [req.session.userId]);

  if (rows.length == 0 && rows2.length == 0) {
    hasRecipes = false;
  }

  res.render('cookbook', {
    "recipes": rows,
    "cocktails": rows2,
    "hasRecipes": hasRecipes
  });
});

app.get('/cookbook/recipe_delete', isAuthenticated, async (req, res) => {
  let id = req.query.recipe_id;
  let sql = `DELETE FROM user_recipe
   			  WHERE recipe_id = ?`;
  let rows = await executeSQL(sql, [id]);
  res.redirect('/cookbook');
});

app.get('/cookbook/cocktail_delete', isAuthenticated, async (req, res) => {
  let id = req.query.cocktail_id;
  let sql = `DELETE FROM user_cocktail
   			  WHERE cocktail_id = ?`;
  let rows = await executeSQL(sql, [id]);
  res.redirect('/cookbook');
});

app.get('/search', (req, res) => {
  res.render('search', {
    "drinkOne": null,
    "drinkTwo": null,
    "recipeOne": null,
    "recipeTwo": null,
    "response": null,
    "selection": null,
    "line": null
  })
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/signup');
});


app.post('/login', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let userValid = true;
  let sql = 'SELECT username, password FROM users WHERE username = ?';
  let params = [username];
  let users = await executeSQL(sql, params);
  console.log(users[0]);

  if (users.length > 0) {
    if (users[0].username != username) {
      userValid = false;
    }
    if (users[0].password != password) {
      userValid = false;
    }
  }
  if (userValid) {
    req.session.authenticated = true;
    req.session.userId = username;
    console.log(req.session.userId)
    res.render('home');
  }
  else {
    alert("Password or Username is invaild");
    res.render('signup', {user: users});
  }


});

app.get('/signup', (req, res) => {
  res.render('signup', {
    "userTaken": null
  });
});

app.get('/profile', isAuthenticated, async (req, res) => {
  let username = req.session.userId;

  res.render('profile', { 'user': username });
});

app.post('/profile', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let editPass = req.body.editPass;

  if (editPass) {

    let sql = 'UPDATE users SET username = ?, password = ? WHERE username = ?';
    let params = [username, password, req.session.userId];
    let users = await executeSQL(sql, params);
    req.session.userId = username;

  } else {

    let sql = 'UPDATE users SET username = ? WHERE username = ?';

    let users = await executeSQL(sql, [username, req.session.userId]);
    req.session.userId = username;

  }

  res.render('profile', { 'user': username });
});

app.post('/signup', async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let sql = 'SELECT username FROM users WHERE username = ?';
  let params = [username];
  let users = await executeSQL(sql, params);

  if (users.length > 0) {
    res.render('signup', {
      "userTaken": "Username Taken. Please Try Again"
    });
  } else {

    let insSQL = 'INSERT INTO users (username, password) VALUES (?,?)';
    let insParams = [username, password];
    let insert = await executeSQL(insSQL, insParams);
    req.session.authenticated = true;
    req.session.userId = username;
    res.render('home');
  }

});

app.get('/randRecipes', async (req, res) => {
  const request = require('request');
  //FOOD
  let recipeOne;
  let recipeTwo;

  var recipes = ["Fresh vegetable and chicken stew", "English Potato Balloons", "English Muffin French Toa", "Empire State Muffins", "Mashed-Potato Pancakes", "Emeril's Crab Meat Deviled Eggs", "Fresh Veggie Basil Salad", "Mediterranean Kale Saute", "Emma's Pumpkin Bread", "English Christmas Pudding", "Pizza with Lobster And Pesto", "Fresh Pasta Primavera", "Honey Whole Grain Bread", "Ceviche Tacos", "Golden Split Pea Soup with Ham", "Honey's Pickled Carrots", "Great Dane Gobbler Loaf", "Emeril's Banana and Pecan Beignets", "Fresh Hawaiian Ginger Banana Bread", "Ellen's Cheese Cake", "Elvis' Hush Puppies", "Sweet Potato Pie with Bourbon Cream Sauce"];
  let rand = Math.floor(Math.random() * (21));
  var query = recipes[rand];

  request.get({
    url: 'https://api.api-ninjas.com/v1/recipe?query=' + query,
    headers: {
      'X-Api-Key': 'TMJkc9KCpjaq/almCXvTJw==cuFMosR9pFMmynpV'
    },
  }, function(error, response, body) {
    if (error) return console.error('Request failed:', error);
    else if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
    else recipeOne = JSON.parse(body);

    if (rand == 21) {
      query = recipes[rand - 1]
    } else {
      query = recipes[rand + 1];
    }

    request.get({
      url: 'https://api.api-ninjas.com/v1/recipe?query=' + query,
      headers: {
        'X-Api-Key': 'TMJkc9KCpjaq/almCXvTJw==cuFMosR9pFMmynpV'
      },
    }, function(error, response, body) {
      if (error) return console.error('Request failed:', error);
      else if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
      else recipeTwo = JSON.parse(body);
      //recipeOne[0]

      //DRINKS
      let drinkNames = ["Black Walnut Old Fashioned", "Autumn Negroni", "Bloody Mary", "Strawberry Daiquiri", "Apple Martini", "Mezcal Margarita", "Espresso Martini", "Whiskey Sour", "Brandy Manhattan", "Mojito Blanco", "Moscow Mule", "Clover Club", "Stormy Mai Tai", "French 75", "Palomaesque", "Lemon Drop", "Pisco Sour", "Americano perfecto", "Gin Fizz", "Bourbon Bramble", "Brancolada", "Boston Sidecar"];
      rand = Math.floor(Math.random() * (21));
      var name = drinkNames[rand];
      let parsedBodyTwo;
      let parsedBodyOne;

      request.get({
        url: 'https://api.api-ninjas.com/v1/cocktail?name=' + name,
        headers: {
          'X-Api-Key': 'TMJkc9KCpjaq/almCXvTJw==cuFMosR9pFMmynpV'
        },
      }, function(error, response, body) {
        if (error) return console.error('Request failed:', error);
        else if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
        else parsedBodyOne = JSON.parse(body);


        if (rand == 21) {
          name = drinkNames[rand - 1]
        } else {
          name = drinkNames[rand + 1];
        }

        request.get({
          url: 'https://api.api-ninjas.com/v1/cocktail?name=' + name,
          headers: {
            'X-Api-Key': 'TMJkc9KCpjaq/almCXvTJw==cuFMosR9pFMmynpV'
          },
        }, function(error, response, bodyTwo) {
          if (error) return console.error('Request failed:', error);
          else if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
          else

            parsedBodyTwo = JSON.parse(bodyTwo);
          res.render('search', {
            "drinkOne": parsedBodyOne[0],
            "drinkTwo": parsedBodyTwo[0],
            "cookbook": emoji,
            "recipeOne": recipeOne[0],
            "recipeTwo": recipeTwo[0],
            "response": null,
            "selection": null,
            "line": "------------------------------------------------"
          });
        });
      });
    });
  });
});

app.get('/recipeSearch', async (req, res) => {
  let selection = req.query.radio;
  let keyword = req.query.keyword;
  var select;

  //FOOD
  if (selection == "food") {
    request.get({
      url: 'https://api.api-ninjas.com/v1/recipe?query=' + keyword,
      headers: {
        'X-Api-Key': 'TMJkc9KCpjaq/almCXvTJw==cuFMosR9pFMmynpV'
      },
    }, function(error, response, body) {
      if (error) return console.error('Request failed:', error);
      else if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
      else select = JSON.parse(body);
      res.render('search', {
        "response": select,
        "selection": selection,
        "drinkOne": null,
        "drinkTwo": null,
        "recipeOne": null,
        "recipeTwo": null,
        "message": "No results found. Please try again!",
        "line": "------------------------------------------------"
      })
    });
    //DRINK
  } else if (selection == "drink") {
    request.get({
      url: 'https://api.api-ninjas.com/v1/cocktail?name=' + keyword,
      headers: {
        'X-Api-Key': 'TMJkc9KCpjaq/almCXvTJw==cuFMosR9pFMmynpV'
      },
    }, function(error, response, body) {
      if (error) return console.error('Request failed:', error);
      else if (response.statusCode != 200) return console.error('Error:', response.statusCode, body.toString('utf8'));
      else select = JSON.parse(body);
      res.render('search', {
        "response": select,
        "selection": selection,
        "drinkOne": null,
        "drinkTwo": null,
        "recipeOne": null,
        "recipeTwo": null,
        "line": "------------------------------------------------"
      })
    });
  }
});

app.post('/addRecipe', async (req, res) => {
  if (req.session.authenticated) {
    let title = req.body.title;
    let servings = req.body.servings;
    let ingredients = req.body.ingredients;
    let instructions = req.body.instructions;
    let username = req.session.userId;

    let sql = `INSERT INTO user_recipe (name, ingrInfo, servings, instructions, user)
               VALUES (?, ?, ?, ?, ?)`;
    let params = [title, ingredients, servings, instructions, username];

    let rows = await executeSQL(sql, params);
    //console.log(rows);      
    res.redirect("/home");
  }
  else {
    res.redirect("/signup");
  }

});

app.post('/addDrink', async (req, res) => {
  if (req.session.authenticated) {
    let name = req.body.name;
    let ingredients = req.body.ingredients;
    let instructions = req.body.instructions;
    let username = req.session.userId;

    let sql = `INSERT INTO user_cocktail (name, ingrInfo, instructions, user)
               VALUES (?, ?, ?, ?)`;
    let params = [name, ingredients, instructions, username];

    let rows = executeSQL(sql, params);
    res.redirect("/home");
  } else {
    res.redirect("/signup");
  }
});

async function executeSQL(sql, params) {
  return new Promise(function(resolve, reject) {
    pool.query(sql, params, function(err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}

function isAuthenticated(req, res, next) {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect('/signup');
  }
}

function dbConnection() {

  const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env['host'],
    user: process.env['user'],
    password: process.env['password'],
    database: process.env['db']
  });

  return pool;

}

//start server
app.listen(3000, () => {
  console.log("Expresss server running...")
});