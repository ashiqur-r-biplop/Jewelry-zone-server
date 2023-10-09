const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
const username = process.env.USER_NAME;
const password = process.env.PASSWORD;
const uri = `mongodb+srv://${username}:${password}@cluster0.klmvqmu.mongodb.net/?retryWrites=true&w=majority`;

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log(authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access2" });
    }

    req.decoded = decoded;
    next();
  });
};

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    const userCollection = client.db("Jewelry_zone").collection("users");
    const JewelryCollection = client
      .db("Jewelry_zone")
      .collection("AllJewelry");

    // await client.connect();

    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // get user role
    app.get("/userRole/:email", async (req, res) => {
      const email = req.params.email;
      const query = await userCollection.findOne({ email: email });
      console.log(email);
      res.send(query);
    });
    // post Jewelry
    app.post("/Jewelry", async (req, res) => {
      const body = req.body;
      const Jewelry = {
        ...body,
        status: "padding",
      };
      console.log(Jewelry);
      const result = await JewelryCollection.insertOne(Jewelry);
      res.send(result);
    });
    // get pending Product
    app.get("/pending-product/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const filter = { sellerEmail: email, status: "padding" };
        const result = await JewelryCollection.find(filter).toArray();
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
    // get all user
    app.get("/all-user", async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.send(result);
      } catch (error) {console.log(error);}
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Jewelry testing server ");
});

app.listen(port, () => {
  console.log(`Jewelry is sitting on port ${port}`);
});
