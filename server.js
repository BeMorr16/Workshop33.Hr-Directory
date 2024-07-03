const express = require("express");
const app = express();
const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);

app.use(express.json());
app.use(require("morgan")("dev"));

  
app.get('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM employees ORDER BY person_name;`
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (error) {
        next(error)
    }
})

app.get('/api/departments', async(req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM departments;`
        const response = await client.query(SQL)
        res.send(response.rows)
    } catch (error) {
        next(error)
    }
})

app.post('/api/employees', async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO employees(person_name, department_id)
        VALUES($1, $2)
        RETURNING *;
        `
        const response = await client.query(SQL, [req.body.person_name, req.body.department_id])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }
})

app.delete('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE from employees WHERE id = $1;`
        const response = await client.query(SQL, [req.params.id])
        res.sendStatus(204)
    } catch (error) {
        next(error)
    }
})

app.put('/api/employees/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE employees
        SET person_name=$1, department_id=$2, updated_at= now()
        WHERE id=$3
        RETURNING *;`
        const response = await client.query(SQL, [req.body.person_name, req.body.department_id, req.params.id])
        res.send(response.rows[0])
    } catch (error) {
        next(error)
    }
})

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: `${err}` });
});
  

const init = async () => {
  await client.connect();
    let SQL = `
  DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
    );
    CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    person_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    department_id INTEGER REFERENCES departments(id) NOT NULL
    );
    `;
  await client.query(SQL);
  console.log('table created')
  SQL = `
  INSERT INTO departments(name) VALUES('Human Resources');
  INSERT INTO departments(name) VALUES('Sales');
  INSERT INTO departments(name) VALUES('Legal');
  INSERT INTO departments(name) VALUES('Tech');
  INSERT INTO employees(person_name, department_id) VALUES('Bob', (SELECT id FROM departments WHERE name='Sales'));
  INSERT INTO employees(person_name, department_id) VALUES('Alice', (SELECT id FROM departments WHERE name='Legal'));
  INSERT INTO employees(person_name, department_id) VALUES('Charlie', (SELECT id FROM departments WHERE name='Tech'));
  `;
  await client.query(SQL)
  console.log('data seeded')
  const PORT = process.env.PORT || 5173;
  app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}`);
  });
};
init();
