/**
 * Sample data loader for the database
 */

import { DatabaseEngine } from './DatabaseEngine';

export function loadSampleData(engine: DatabaseEngine): void {
  try {
    // Create employees table
    engine.execute('CREATE TABLE employees (id, name, department, salary)');
    engine.execute("INSERT INTO employees VALUES (1, 'Alice Johnson', 'Engineering', '95000')");
    engine.execute("INSERT INTO employees VALUES (2, 'Bob Smith', 'Marketing', '75000')");
    engine.execute("INSERT INTO employees VALUES (3, 'Charlie Brown', 'Engineering', '85000')");
    engine.execute("INSERT INTO employees VALUES (4, 'Diana Prince', 'HR', '70000')");

    // Create products table
    engine.execute('CREATE TABLE products (id, name, category, price)');
    engine.execute("INSERT INTO products VALUES (1, 'Laptop', 'Electronics', '1200')");
    engine.execute("INSERT INTO products VALUES (2, 'Mouse', 'Electronics', '25')");
    engine.execute("INSERT INTO products VALUES (3, 'Desk', 'Furniture', '350')");
    engine.execute("INSERT INTO products VALUES (4, 'Chair', 'Furniture', '200')");

    // Create customers table
    engine.execute('CREATE TABLE customers (id, name, email, city)');
    engine.execute("INSERT INTO customers VALUES (1, 'John Doe', 'john@example.com', 'New York')");
    engine.execute("INSERT INTO customers VALUES (2, 'Jane Smith', 'jane@example.com', 'Los Angeles')");
    engine.execute("INSERT INTO customers VALUES (3, 'Mike Wilson', 'mike@example.com', 'Chicago')");

    console.log('Sample data loaded successfully');
  } catch (error) {
    console.error('Error loading sample data:', error);
  }
}
