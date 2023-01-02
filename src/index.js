const { response } = require('express');
const express = require('express');
const {v4: uuidv4} = require("uuid");

const app = express();
app.use(express.json());

const customers = [];

function verifyAccountCPF(request,response,next)
{
  const {cpf} = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer)
    return response.status(404).json({error: "Customer not exists!"});
  else
  {

    request.customer = customer;
    return next();
  }  

}

function setAccount(request,response)
{
  const {cpf,name} = request.body;   

  const AlreadyExists = customers.some((customer) => customer.cpf === cpf);

  if (AlreadyExists)
  {
    return response.status(400).json({error: "Customer already exists!"});
  }

  customers.push(
    {
        cpf,
        name,
        id : uuidv4(),
        statement: []
    }
    );

    return response.status(201).send(customers);
}

function setDeposit(request,response)
{
  const {description, ammount} = request.body;
  const { customer } = request;

  const statementOperation = 
  {
    description,
    ammount,
    created_at: new Date(),
    type: "credit", 
  }

  customer.statement.push(statementOperation);

  return response.status(201).send(customer);

}


function calcBalance(statement) 
{
  const balance = statement.reduce((acc,operation) => 
    {
      if(operation.type === 'credit')
      {
        return acc + operation.ammount;
      }
      else
      {
        return acc - operation.ammount;
      }
    },0 
  );

  return balance;

}

function setWithdraw(request,response)
{
  const { ammount} = request.body;
  const { customer } = request;

  const balance = calcBalance(customer.statement);

  if (balance < ammount)
  {
    return response.status(400).json({error: "Insufficient funds!"});  
  }

  const statementOperation = 
  {
    description : "Withdraw",
    ammount,
    created_at: new Date(),
    type: "debit", 
  }

  customer.statement.push(statementOperation);

  return response.status(201).send(customer);

}

function getStatement(request,response)
{
    const { customer } = request;

    return response.json(customer.statement)
}

app.post("/account",setAccount)
app.get("/statement",verifyAccountCPF,getStatement);
app.post("/deposit",verifyAccountCPF,setDeposit);
app.post("/withdraw",verifyAccountCPF,setWithdraw);

app.listen(3333);
