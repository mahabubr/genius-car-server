const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000

//! middleware
app.use(cors())
app.use(express.json())

// require('crypto').randomBytes(64).toString('hex')

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (error, decoded) {
        if (error) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded
        next()
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vlhy1ml.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const serviceCollection = client.db('geniusCar').collection('services')
        const orderCollection = client.db('geniusCar').collection('orders')

        // Read Method

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })

        app.get('/orders', verifyJWT, async (req, res) => {

            const decoded = req.decoded
            if (decoded.email !== req.query.email) {
                return res.status(401).send({ message: 'unauthorized access' })
            }

            // console.log(req.headers.authorization);

            let query = {}
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
        })

        // Create Method

        app.post('/jwt', (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" })
            res.send({ token })
        })

        app.post('/orders', verifyJWT, async (req, res) => {
            const orders = req.body
            const result = await orderCollection.insertOne(orders)
            res.send(result)
        })

        // Update Method

        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const status = req.body.status
            const query = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        // Delete Method

        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id
            const query = {
                _id: ObjectId(id)
            }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })
    }
    finally {

    }
}

run().catch(e => console.log(e.message))


app.get('/', (req, res) => {
    res.send('GENIUS CAR SERVER IS RUNNING')
})

app.listen(port, () => {
    console.log(`RUNNING SERVE IN PORT ${port}`);
})