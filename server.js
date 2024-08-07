const express = require("express");
const app = express();
const pg = require("pg");
app.use(express.json());
app.use(require("morgan")("dev"));
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

const PORT = process.env.PORT || 5432;

app.use((error, req, res, next) => {
  res.status(res.status || 500).send({ error: error });
});

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * from employees`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * from departments`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `
        INSERT INTO employees(name, department_id)
        values ($1, $2) 
        RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    console.log(error);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
              UPDATE EMPLOYEES
              SET name = $1, department_id = $2, updated_at= now()
                WHERE id = $3;  
                `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    res.send(response.rows);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `
                    DELETE from employees WHERE id = $1;  
                `;
    const response = await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    console.log(error);
  }
});

const init = async () => {
  await client.connect();
  let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        department VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        name VARCHAR(255) NOT NULL,
        department_id INTEGER REFERENCES departments(id) NOT NULL
    );
  `;
  await client.query(SQL);
  SQL = `
    INSERT INTO departments(department) values('FRUITS');
    INSERT INTO departments(department) values('FROZEN');
    INSERT INTO departments(department) values('VEGGIES');
    INSERT INTO departments(department) values('BREAD');
    INSERT INTO employees(name, department_id) values('BETTY', (SELECT id from departments WHERE department='FRUITS'));
    INSERT INTO employees(name, department_id) values('NISHANT', (SELECT id from departments WHERE department='FROZEN'));
    INSERT INTO employees(name, department_id) values('ARIANE', (SELECT id from departments WHERE department='VEGGIES'));
    INSERT INTO employees(name, department_id) values('MARIA', (SELECT id from departments WHERE department='BREAD'));
  `;

  await client.query(SQL);
  app.listen(PORT, () => {
    console.log(`I am listening on port number ${PORT}`);
  });
};

init();
