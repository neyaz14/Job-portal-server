const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

 





const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_key}@cluster0.epj76.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //   await client.connect();
    app.get('/', (req, res) => {
      res.send('Job is falling from the sky')
    })




    //   await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");




    // all jobs api
    const jobsCollection = client.db('job-portal').collection('jobs');
    const jobApplicationCollection = client.db('job-portal').collection('job_applications');

    app.get('/jobs', async (req, res) => {
      const coursor = jobsCollection.find();
      const result = await coursor.toArray();
      res.send(result);
    })


    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    })


    // get all data, get one data, get some data [o, 1, many]
    // 
    app.get('/job-applications', async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email }
      const result = await jobApplicationCollection.find(query).toArray();

      // fokira way to aggregate data
      for (const application of result) {
        console.log(application.job_id)
        const query1 = { _id: new ObjectId(application.job_id) }
        const job = await jobsCollection.findOne(query1);
        if (job) {
          application.title = job.title;
          application.location = job.location;
          application.company = job.company;
          application.company_logo = job.company_logo;
        }
      }

      res.send(result);
    })

    // job application api
    app.post('/job-applications', async (req, res) => {
      const apllications = req.body;
      const result = jobApplicationCollection.insertOne(apllications);
      res.send(result)
    })







  } finally {
    // Ensures that the client will close when you finish/error
    //   await client.close();
  }
}
run().catch(console.dir);





app.listen(port, () => {
  console.log('Job portal is working', port);
})