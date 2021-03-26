const express = require('express')
const cors = require('cors')
const app = express()
const port = 5000

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

require('dotenv').config();


const admin = require('firebase-admin');
const serviceAccount = require("./config/burj-al-arab-e0d83-firebase-adminsdk-7osez-5cdf71183f.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});




const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v8nsc.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const collection = client.db("burjAlArab").collection("bookings");

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        collection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.get('/bookings', (req, res) => {
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            admin
                .auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    if (tokenEmail == req.query.email) {
                        collection.find({ email: req.query.email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send('Unauthorize access')
                    }
                })
                .catch((error) => {
                    res.status(401).send('Unauthorize access')
                });
        }
        else {
            res.status(401).send('Unauthorize access')
        }


    })

});


app.listen(port)