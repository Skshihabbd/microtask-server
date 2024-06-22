const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");

// middleware
const corsOptions={
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  withCredentials: true,
};

  app.use(cors())

// app.use(cors());

app.use(express.json());
app.use(cookieParser());

// main section of api

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pppehle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


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
    // await client.connect();

    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    const userData = client.db("MicroWorker").collection("userData");
    const taskCollection = client.db("MicroWorker").collection("taskCollection"); 
    const submissionCollection = client.db("MicroWorker").collection("submissionCollection"); 
    const paymentCollection = client.db("MicroWorker").collection("paymentCollection"); 
    const withdrawCollection = client.db("MicroWorker").collection("withdrawCollection"); 

    // jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })

    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization);
      console.log(req.headers)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }

    // role base middleware

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      console.log(email)
      const query = { email: email };
      const user = await userData.findOne(query);
      console.log(user)
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    const verifyWorker = async (req, res, next) => {
      const email = req.decoded.email;
      console.log(email)
      const query = { email: email };
      const user = await userData.findOne(query);
      console.log(user)
      const isAdmin = user?.role === 'worker';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    const verifyTaskcreator = async (req, res, next) => {
      const email = req.decoded.email;
      console.log(email)
      const query = { email: email };
      const user = await userData.findOne(query);
      console.log(user)
      const isAdmin = user?.role === 'task creator';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }
    // role base middleware
    // jwt related api
// withdrwacollection api
app.post('/withdraw',async(req,res)=>{
  const taskInfo=req.body 
  console.log(taskInfo)
  const result =await withdrawCollection.insertOne(taskInfo) 
  res.send(result);

}) 

app.put("/withdrawuser/:id", async(req, res) => {
  const id = req.params.id;
  const filter = {_id: new ObjectId(id) };
   const option = { upsert: true };
  const updatedInfo = req.body;
  console.log(updatedInfo,id)
   const userCoinUpdate = { 
    $set: {
      name: updatedInfo.name,
      
       email: updatedInfo.email,
      
      
      role: updatedInfo.role ,
      coin: updatedInfo.coin,
     image:updatedInfo.image,
      
     
    },
  };

console.log(userCoinUpdate)
  const result= await userData.updateOne(filter,userCoinUpdate,option)
  res.send(result)
});


// withdrwacollection api


    app.get('/alluser',verifyToken,verifyAdmin,async(req,res)=>{
      
      //  console.log(req.query)
       
      
      const users = await userData.find().toArray();
      res.send(users)
    }) 
    app.get('/user',verifyToken,async(req,res)=>{
      
      //  console.log(req.query)
       let query={} 
       if(req.query?.email){
        query={email:req.query.email}
       }
      
      const users = await userData.findOne(query);
      res.send(users)
    }) 
    app.get('/userr',verifyToken,async(req,res)=>{
      
      //  console.log(req.query)
       let query={} 
       if(req.query?.email){
        query={email:req.query.email}
       }
      
      const users = await userData.findOne(query);
      res.send(users)
    }) 

    app.get('/usercreatorhomes',verifyToken,async(req,res)=>{
      
        console.log(req.query)
       let query={} 
       if(req.query?.email){
        query={email:req.query.email}
       }
      
      const users = await userData.findOne(query);
      res.send(users)
    }) 

    // worker home 
    app.get('/userworkerhomes',verifyToken,async(req,res)=>{
      
      console.log(req.query)
     let query={} 
    //  if(req.query?.email){
    //   query={email:req.query.email }
    //  }
    
     const users = await userData.findOne({ $and: [{ email: req.query?.email }, { role: 'worker' }] });

    res.send(users)
  }) 

  // submission collection worker home

  app.get('/userworkerhomessubmit',verifyToken,async(req,res)=>{
      
    console.log(req.query)
   let query={} 
   if(req.query?.email){
    query={
      worker_email:req.query.email }
   }
  
   const users = await submissionCollection.find(query).toArray();

  res.send(users)
}) 

  // submission collection worker home

  // submission worker home sun of approved payable amount
  app.get('/userworkerhomessubmitpay',verifyToken,async(req,res)=>{
      
    console.log(req.query)
   let query={} 
  //  if(req.query?.email){
  //   query={
  //     worker_email:req.query.email }
  //  }
  
   const users = await submissionCollection.find({$and:[{worker_email:req.query.email},{status:'approved'}]}).toArray();

  res.send(users)
}) 
  // submission worker home sun of approved payable amount
    // worker home
    app.get('/usere',verifyToken, async(req,res)=>{
      
        console.log(req.query)
        let query={}
       if(req.query?.role){
        query={role:req.query.role}
       }
      
      const users = await userData.find(query).toArray();
      res.send(users)
    }) 
    app.get('/taskcreators/:id',verifyToken,async(req,res)=>{
 
const idd = req.params.id;
console.log(req.params.id)
const query = { _id: new ObjectId(idd) };
const result = await taskCollection.findOne(query);
res.send(result);

    }) 

    // managetask

    app.get('/managetasksall',verifyToken  ,async(req,res)=>{


      const result=await taskCollection.find().toArray()
      res.send(result)
    })

    app.delete("/managetasksall/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // managetask 

    // admin home all api

app.get('/adminhomealluser',verifyToken,async(req,res)=>{
  const users = await userData.find().toArray();
  res.send(users)

})
app.get('/adminhomeallpayment',verifyToken,async(req,res)=>{
  const data = await withdrawCollection.find().toArray();
  res.send(data)

})

app.delete("/adminhomeallpayment/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }; 
  console.log(id)
  const result = await withdrawCollection.deleteOne(query);
  res.send(result);
}); 


app.put("/adminhomeallpayment/:id", async(req, res) => {
  const id = req.params.id;
  const filter = {_id: new ObjectId(id) };
   const option = { upsert: true };
  const updatedInfo = req.body;
  console.log(updatedInfo,id)
   const userCoinUpdate = { 
    $set: {
      name: updatedInfo.name,
      
       email: updatedInfo.email,
      
      
      role: updatedInfo.role ,
      coin: updatedInfo.coin,
     image:updatedInfo.image,
      
     
    },
  };

console.log(userCoinUpdate)
   const result= await userData.updateOne(filter,userCoinUpdate,option)
   res.send(result)
}); 

// main website home page database

app.get('/homepagedata',verifyToken,async(req,res)=>{

  const result=await userData.find({role:'worker'} ).sort({coin:-1}).limit(6).toArray() 
  res.send(result)

})


// main website home page database

    // admin home all api

    //manage user

    app.delete("/managedeleteuser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userData.deleteOne(query);
      res.send(result);
    });
    //manage user

    app.get('/taskcreatorall',verifyToken ,async(req,res)=>{


      const result=await taskCollection.find({quantity: { $gt: 0 } }).toArray()
      res.send(result)
    })
    app.delete("/taskcreator/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });
    app.get("/taskcreatorsall/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.findOne(query);
      res.send(result);
    });

    app.get('/taskcreator',verifyToken,async(req,res)=>{
      
      //  console.log(req.query)
       let query={} 
       if(req.query?.email){
        query={email:req.query.email}
       }
      
      const tasks = await taskCollection.find(query).sort({currenttime:-1}).toArray();
      res.send(tasks)
    })



    app.get('/taskcreatorhome',verifyToken,async(req,res)=>{
      
      //  console.log(req.query)
       let query={} 
       if(req.query?.email){
        query={email:req.query.email}
       }
      
      const tasks = await taskCollection.find(query).toArray();
      res.send(tasks)
    })
    app.post("/user", async (req, res) => {
      const user = req.body;
      console.log(user);

      const query = { email: user.email };
      const existingUser = await userData.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userData.insertOne(user);
      res.send(result);
    });

    app.post('/taskcreator',async(req,res)=>{
const taskInfo=req.body 
console.log(taskInfo)
const result =await taskCollection.insertOne(taskInfo) 
res.send(result);
    }) 
    app.post('/tasksubmission',async(req,res)=>{
const taskInfo=req.body 
console.log(taskInfo)
const result =await submissionCollection.insertOne(taskInfo) 
res.send(result);
    }) 
    app.get('/taskcreatorhomesubmit',verifyToken,async(req,res)=>{
const taskInfo=req.body 

let query={} 


const result =await submissionCollection.find({$and: [
  { creator_email:req.query?.email },
   { status: 'pending' }
]}).toArray() 
res.send(result);
    }) 



    app.put("/user/:id", async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id) };
       const option = { upsert: true };
      const updatedInfo = req.body;
      console.log(updatedInfo,id)
       const userCoinUpdate = { 
        $set: {
          name: updatedInfo.name,
          
           email: updatedInfo.email,
          
          
          role: updatedInfo.role ,
          coin: updatedInfo.coin,
         image:updatedInfo.image,
          
         
        },
      };

console.log(userCoinUpdate)
      const result= await userData.updateOne(filter,userCoinUpdate,option)
      res.send(result)
    });

    app.put("/userup/:id", async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id) };
       const option = { upsert: true };
      const updatedInfo = req.body;
      console.log(updatedInfo,id)
      const userCoinUpdate = { 
        $set: {
          name: updatedInfo.name,
          
           email: updatedInfo.email,
          
          
          role: updatedInfo.role ,
          coin: updatedInfo.coin,
         image:updatedInfo.image,
          
         
        },
      };

console.log(userCoinUpdate)
      const result= await userData.updateOne(filter,userCoinUpdate,option)
      res.send(result)
    });

    // useruphomecreaator

    app.put("/useruphomrcreator/:id", async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id) };
       const option = { upsert: true };
      const updatedInfo = req.body;
      console.log(updatedInfo,id)
      const userCoinUpdate = { 
        $set: {
          name: updatedInfo.name,
          
           email: updatedInfo.email,
          
          
          role: updatedInfo.role ,
          coin: updatedInfo.coin,
         image:updatedInfo.image,
          
         
        },
      };

console.log(userCoinUpdate)
      const result= await userData.updateOne(filter,userCoinUpdate,option)
      res.send(result)
    });
    // useruphomecreaator
    app.put("/hometaskupdate/:id", async(req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id) };
       const option = { upsert: true };
      const updatedInfo = req.body;
      console.log(updatedInfo,id)
      const userCoinUpdate = { 
        $set: {
          task_id:updatedInfo.task_id,
          task_title:updatedInfo.task_title,
          task_details:updatedInfo.task_details,
          task_img_url:updatedInfo.task_img_url,
          payableAmount:updatedInfo.payableAmount,
          worker_email:updatedInfo.worker_email,
          creator_email:updatedInfo.creator_email,
          creator_name:updatedInfo.creator_name,
          current_Date:updatedInfo.current_Date,
          status:updatedInfo.status,
          
         
        },
      };

console.log(userCoinUpdate)
      const result= await submissionCollection.updateOne(filter,userCoinUpdate,option)
      res.send(result)
    });


    app.put('/taskcollectionupdate/:id',async(req,res)=>{

      const id = req.params.id;
      const filter = {_id: new ObjectId(id) };
       const option = { upsert: true };
      const updatedInfo = req.body;
      console.log(updatedInfo,id)

      const taskdetailsUpdate = { 
        $set: {
          completionDate:updatedInfo.completionDate,
          creatorName:updatedInfo.creatorName,
          email:updatedInfo.email,
          image:updatedInfo.image,
          payableAmount:updatedInfo.payableAmount,
          quantity:updatedInfo.quantity,
          submissionInfo:updatedInfo.submissionInfo,
          taskDetails:updatedInfo.taskDetails,
          title:updatedInfo.title,
          
         
        }
       
      };
      console.log(taskdetailsUpdate)
      const result= await taskCollection.updateOne(filter,taskdetailsUpdate,option)
      res.send(result)

    })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// main section

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
