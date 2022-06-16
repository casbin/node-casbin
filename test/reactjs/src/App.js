import './App.css';
import Enforcer from "./Enforcer.js";

function App() {
  return (
    <div className="App">
      <Enforcer sub="alice" obj="data1" act="read"/>
    </div>
  );
}

export default App;
