/* src/App.js */
import React, { useEffect, useMemo, useState } from "react";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import { createTodo, updateTodo } from "./graphql/mutations";
import { listTodos } from "./graphql/queries";
import { onCreateTodo, onUpdateTodo } from "./graphql/subscriptions";
// import { Todo } from '../amplify/backend/api/executivehomes';

import awsExports from "./aws-exports";
Amplify.configure(awsExports);


const initialState = { name: "", description: "", category: "" };

const App = () => {
  const [formState, setFormState] = useState(initialState);
  const [todos, setTodos] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [finishedFilter, setFinishedFilter] = useState("all");

  const possibleCategories = useMemo(() => {
    let possibleCategories = {"all":true};
      todos.forEach((t) => {
        if (t.category) {
          possibleCategories[t.category] = true;
        }
      });
      console.log("🚀 ~ file: App.js:78 ~ possibleCategories ~ possibleCategories:", possibleCategories);
      return possibleCategories;
  }, [todos]);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    const createSubscription = API.graphql(graphqlOperation(onCreateTodo)).subscribe((msg) => {
      console.log(msg);
      const createdTodo = msg.value.data.onCreateTodo;
      // console.log("🚀 ~ file: App.js:31 ~ createSubscription ~ createdTodo:", createdTodo)
      setTodos([...todos, createdTodo]);
    });

    const updateSubscription = API.graphql(graphqlOperation(onUpdateTodo)).subscribe((msg) => {
      const updatedTodo = msg.value.data.onUpdateTodo;
      console.log("🚀 ~ file: App.js:38 ~ updateSubscription ~ updatedTodo:", updatedTodo);
      for(let i = 0; i<todos.length; i++){
        if(todos[i].id == updatedTodo.id){
          todos[i] = updatedTodo;
          console.log("🚀 ~ file: App.js:52 ~ updateSubscription ~ todos:", todos)
          console.log("🚀 ~ file: App.js:41 ~ updateSubscription ~ updatedTodo:", updatedTodo)
          setTodos([...todos]);
        }
      }
    });

    return () => {
      createSubscription.unsubscribe();
      updateSubscription.unsubscribe();
    }
  }, []); 


  const filteredTodos = useMemo(() => {
    let filtered = todos;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((todo) => {
        return todo.category === categoryFilter;
      });
    }

    if(finishedFilter !== 'all'){
      const finishedbool = (finishedFilter === 'finished'); 
      filtered = filtered.filter((todo) => {
        return todo.finished === finishedbool;
      });
    }
    return filtered;
  }, [todos, categoryFilter, finishedFilter]);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      const todos = todoData.data.listTodos.items;
      console.log("🚀 ~ file: App.js:28 ~ fetchTodos ~ todos:", todos);
      setTodos(todos);
    } catch (err) {
      console.log("error fetching todos", err);
    }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return;
      const todo = { ...formState, finished: false };
      // setTodos([...todos, todo]);
      // add category
      setFormState(initialState);
      await API.graphql(graphqlOperation(createTodo, { input: todo }));
    } catch (err) {
      console.log("error creating todo:", err);
    }
  }

  async function handleFinishChange(event, todo){
    console.log("🚀 ~ file: App.js:130 ~ handleFinishChange ~ event.target.checked:", event.target.checked)
    const newDetails = {id: todo.id, finished: event.target.checked};
    
    try {
      await API.graphql(graphqlOperation(updateTodo, { input: newDetails }));
    } catch (err) {
      console.log("error updating todo:", err);
    }
  }
  

  return (
    <div style={styles.container}>
      <h2>Todos App</h2>
      <input
        onChange={(event) => setInput("name", event.target.value)}
        style={styles.input}
        value={formState.name}
        placeholder="Name"
      />
      <input
        onChange={(event) => setInput("description", event.target.value)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />
      <input
        onChange={(event) => setInput("category", event.target.value)}
        style={styles.input}
        value={formState.category}
        placeholder="Category"
      />
      <button style={styles.button} onClick={addTodo}>
        Create Todo
      </button>
      <label>
        Category Filter
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {Object.keys(possibleCategories).map((c) => (
            <option value={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Finished Filter
        <select
          value={finishedFilter}
          onChange={(e) => setFinishedFilter(e.target.value)}
        >
          <option value={"all"}>All</option>
          <option value={"unfinished"}>Unfinished</option>
          <option value={"finished"}>Finished</option>
        </select>
      </label>
      {filteredTodos.map((todo, index) => (
        <div key={todo.id ? todo.id : index} style={styles.todo}>
          <p style={styles.todoName}>{todo.name}</p>
          <p style={styles.todoDescription}>Description: {todo.description}</p>
          <p style={styles.todoCategory}>Category: {todo.category}</p>
          <label>
            Finished <input type="checkbox" checked={todo.finished} onChange={e => handleFinishChange(e, todo)}/>
          </label>
        </div>
      ))}
    </div>
  );
};

const styles = {
  container: {
    width: 400,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: 20,
  },
  todo: { marginBottom: 15 },
  input: {
    border: "none",
    backgroundColor: "#ddd",
    marginBottom: 10,
    padding: 8,
    fontSize: 18,
  },
  todoName: { fontSize: 20, fontWeight: "bold" },
  todoDescription: { marginBottom: 0 },
  button: {
    backgroundColor: "black",
    color: "white",
    outline: "none",
    fontSize: 18,
    padding: "12px 0px",
  },
};

export default App;
