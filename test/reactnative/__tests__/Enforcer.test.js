import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import Enforcer from "../Enforcer";

test("Should render enforcer result correctly", async () => {
  const component = render(<Enforcer sub="alice" obj="data1" act="read"/>);
  await waitFor(() => expect(component.getByTestId("enforce-result").children).toEqual(["Allowed"]));
});