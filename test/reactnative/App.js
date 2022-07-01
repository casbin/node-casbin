import React from "react";
import Enforcer from "./Enforcer";

export default function App() {
  return (
    <Enforcer sub="alice" obj="data1" act="read" />
  );
}
