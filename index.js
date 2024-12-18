const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookieParser = require('cookie-parser');



// middleware 
const port = process.env.PORT || 5000;
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



//making a middleware which will 
const VerifyToken = (req, res, next) => {
  // console.log('inside the verify token middleware ', req.cookies);
  const token = req.cookies?.token;
  // console.log(token)
  if (!token) {
    return res.status(401).send({ massege: "Unauthorized User" })
  }
  jwt.verify(token, process.env.JWT_Secrect, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "Access token is not matched" })
    }
    // decode --> kon user ta check kora
    req.user = decoded;

    next();
  })

  // next();
}





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

    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_Secrect, { expiresIn: '5h' });
      res
        .cookie('token', token, {
          httponly: true,
          secure: false,
        })
        .send({ success: true });
    })

// token clearing
app.post('/logout', (req, res)=>{
  res.clearCookie('token', {
    httpOnly:true,
    secure: false
  })
  .send({success:true})
})








    app.get('/jobs', async (req, res) => {

      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email }
      }
      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
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
    app.get('/job-applications', VerifyToken, async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email }

// now lets check the token 
      // req.user.email 
      // (token er sathe connected  email) !== req.query.email ()
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: "forbidden access "})
      }
 

      const result = await jobApplicationCollection.find(query).toArray();

 


      // fokira way to aggregate data
      for (const application of result) {
   
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

    // app.get('/job-appllications/:id) ==> mean get a specific job application by id 
    app.get('/job-applications/jobs/:job_id', async (req, res) => {
      const jobId = req.params.job_id;
      const query = { job_id: jobId }
      const result = await jobApplicationCollection.find(query).toArray();
      res.send(result);
    })


    // patch - partial update from viewapplicantions page
    app.patch('/job-applications/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: data.status
        }
      }
      const result = await jobApplicationCollection.updateOne(filter, updatedDoc);
      // console.log(data, 'updated')
      res.send(result)
    })

    // create job as a hr
    app.post('/jobs', async (req, res) => {
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob);


      // Need a better understanding 


      // Not the best way (use aggregate) 
      // skip --> it
      const id = application.job_id;
      const query = { _id: new ObjectId(id) }
      const job = await jobsCollection.findOne(query);
      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      }
      else {
        newCount = 1;
      }

      // now update the job info
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          applicationCount: newCount
        }
      }

      const updateResult = await jobsCollection.updateOne(filter, updatedDoc);

      res.send(result);
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