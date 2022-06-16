import React from "react";
import Enforcer from "../Enforcer.js";
import {render, screen, waitFor} from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect"

test("Should render enforcer result correctly", async () => {
   render(<Enforcer sub="alice" obj="data1" act="read"/>);
   await waitFor(() => expect(screen.getByTestId("enforce-result").textContent).toEqual("Allowed"));
});